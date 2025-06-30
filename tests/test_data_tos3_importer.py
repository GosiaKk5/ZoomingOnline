from pathlib import Path
from unittest import mock

import h5py
import numpy as np
from _pytest.monkeypatch import MonkeyPatch

from src.data_to_s3_importer import load_s3_env, process_file


def create_sample_h5(file_path: Path) -> None:
    with h5py.File(file_path, "w") as f:
        f.create_dataset("samples", data=np.ones((10, 10)))


def test_load_s3_env(monkeypatch: MonkeyPatch) -> None:
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "test-access")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "test-secret")
    monkeypatch.setenv("S3_ENDPOINT_URL", "https://s3.fake.local")
    monkeypatch.setenv("S3_BUCKET_NAME", "mock-bucket")

    env_dict = load_s3_env()
    assert env_dict["access_key"] == "test-access"
    assert env_dict["secret_key"] == "test-secret"  # noqa: S105
    assert env_dict["endpoint_url"] == "https://s3.fake.local"
    assert env_dict["bucket_name"] == "mock-bucket"


def test_process_file(tmp_path: Path) -> None:
    h5_file = tmp_path / "test_file.h5"
    create_sample_h5(h5_file)
    output_dir = tmp_path
    zarr_name = h5_file.with_suffix(".zarr").name
    expected_zarr_path = output_dir / zarr_name

    with (
        mock.patch("src.data_to_s3_importer.convert_hdf5_to_zarr") as mock_convert,
        mock.patch("s3fs.S3Map") as mock_s3map,
        mock.patch("zarr.copy_store") as mock_copy_store,
        mock.patch("shutil.rmtree") as mock_rmtree,
    ):
        mock_s3 = mock.MagicMock()
        process_file(h5_file, output_dir, mock_s3, "test-bucket", skip_upload=False)

        mock_convert.assert_called_once_with(h5_file, expected_zarr_path)
        mock_s3map.assert_called_once_with(
            root=f"s3://test-bucket/{zarr_name}",
            s3=mock_s3,
            check=False,
        )
        mock_copy_store.assert_called_once()
        mock_rmtree.assert_called_once_with(expected_zarr_path)
