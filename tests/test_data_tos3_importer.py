from pathlib import Path

import h5py
import numpy as np
from _pytest.monkeypatch import MonkeyPatch

from src.data_to_s3_importer import (
    load_s3_env,
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
