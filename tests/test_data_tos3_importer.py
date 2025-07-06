from contextlib import suppress
from pathlib import Path
from subprocess import CalledProcessError
from unittest import mock

import h5py
import numpy as np
from _pytest.monkeypatch import MonkeyPatch

from src.data_to_s3_importer import (
    convert_and_get_zarr_path,
    load_s3_env,
    upload_zarr_with_mc,
)


def create_sample_hdf5(file_path: Path) -> None:
    with h5py.File(file_path, "w") as f:
        f.create_dataset("samples", data=np.arange(1000).reshape(1, 1, 1, 1000), dtype=np.int16)


def test_load_s3_env(monkeypatch: MonkeyPatch) -> None:
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing-key")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing-secret-key")
    monkeypatch.setenv("S3_ENDPOINT_URL", "https://fake.endpoint")
    monkeypatch.setenv("S3_BUCKET_NAME", "test-bucket")

    env = load_s3_env()
    assert env["access_key"] == "testing-key"
    assert env["secret_key"] == "testing-secret-key"  # noqa: S105
    assert env["endpoint_url"] == "https://fake.endpoint"
    assert env["bucket_name"] == "test-bucket"


@mock.patch("src.data_to_s3_importer.convert_hdf5_to_zarr")
def test_convert_and_get_zarr_path_calls_converter(mock_convert: mock.MagicMock, tmp_path: Path) -> None:
    hdf_path = tmp_path / "input.hdf"
    hdf_path.touch()
    output_dir = tmp_path / "output"
    output_dir.mkdir()

    zarr_path = convert_and_get_zarr_path(hdf_path, output_dir)
    expected_path = output_dir / "input.zarr"

    assert zarr_path == expected_path
    mock_convert.assert_called_once_with(hdf_path, expected_path)


@mock.patch("shutil.rmtree")
@mock.patch("subprocess.run")
def test_upload_zarr_with_mc_success(
    mock_run: mock.MagicMock,
    mock_rmtree: mock.MagicMock,
    tmp_path: Path,
) -> None:
    local_path = tmp_path / "converted.zarr"
    local_path.mkdir()

    mock_run.return_value = mock.Mock(
        returncode=0,
        stdout="OK\n",
        stderr="",
    )

    upload_zarr_with_mc(
        local_path=local_path,
        bucket="test-bucket",
        remote_key="converted.zarr",
        mc_alias="my-alias",
        keep_local=False,
    )

    expected_cmd = [
        "mc",
        "cp",
        "--recursive",
        str(local_path),
        "my-alias/test-bucket/converted.zarr/",
    ]

    mock_run.assert_called_once_with(expected_cmd, check=True, text=True, capture_output=True)
    mock_rmtree.assert_called_once_with(local_path)


@mock.patch("subprocess.run")
def test_upload_zarr_with_mc_error_handling(
    mock_run: mock.MagicMock,
    tmp_path: Path,
) -> None:
    local_path = tmp_path / "zarr"
    local_path.mkdir()
    mock_run.side_effect = CalledProcessError(
        returncode=1,
        cmd=["mc", "cp", str(local_path)],
        output="some stdout",
        stderr="upload error",
    )

    # ✅ SIM105: Use contextlib.suppress instead of try/except/pass
    with suppress(CalledProcessError):
        upload_zarr_with_mc(local_path, bucket="test-bucket", remote_key="zarr")

    assert mock_run.called
