from pathlib import Path
from unittest import mock

import h5py
import numpy as np
import pytest
from _pytest.monkeypatch import MonkeyPatch

from src.data_to_s3_importer import (
    convert_and_get_zarr_path,
    load_s3_env,
    upload_zarr_to_s3,
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
def test_convert_and_get_zarr_path_calls_converter(
    mock_convert: mock.MagicMock,
    tmp_path: Path,
) -> None:
    hdf_path = tmp_path / "input.hdf"
    hdf_path.touch()
    output_dir = tmp_path / "output"
    output_dir.mkdir()

    zarr_path = convert_and_get_zarr_path(hdf_path, output_dir)
    expected_path = output_dir / "input.zarr"

    assert zarr_path == expected_path
    mock_convert.assert_called_once_with(hdf_path, expected_path)


@mock.patch("shutil.rmtree")
@mock.patch("zarr.copy_store")
@mock.patch("s3fs.S3Map")
def test_upload_zarr_to_s3_success(
    mock_s3map: mock.MagicMock,
    mock_copy: mock.MagicMock,
    mock_rmtree: mock.MagicMock,
    tmp_path: Path,
) -> None:
    local_path = tmp_path / "converted.zarr"
    local_path.mkdir()
    (local_path / ".zgroup").touch()

    upload_zarr_to_s3(
        local_path=local_path,
        bucket="test-bucket",
        remote_key="converted.zarr",
        endpoint_url="https://fake.endpoint",
        access_key="key",
        secret_key="secret",  # noqa: S106
        keep_local=False,
    )

    mock_s3map.assert_called_once()
    mock_copy.assert_called_once()
    mock_rmtree.assert_called_once_with(local_path)


@mock.patch("zarr.copy_store", side_effect=RuntimeError("Zarr failed"))
@mock.patch("s3fs.S3Map")
def test_upload_zarr_to_s3_error(
    mock_s3map: mock.MagicMock,
    mock_copy: mock.MagicMock,
    tmp_path: Path,
) -> None:
    local_path = tmp_path / "broken.zarr"
    local_path.mkdir()
    (local_path / ".zgroup").touch()

    with pytest.raises(RuntimeError, match="Zarr failed"):
        upload_zarr_to_s3(
            local_path=local_path,
            bucket="bucket",
            remote_key="key",
            endpoint_url="https://fake",
            access_key="x",
            secret_key="x",  # noqa: S106
            keep_local=True,
        )

    assert mock_s3map.called
    assert mock_copy.called
