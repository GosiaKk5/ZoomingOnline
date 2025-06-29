import tempfile
from pathlib import Path

import h5py
import numpy as np
import pytest
import zarr

from src.generate_data import (
    generate_dummy_data,
    save_hdf5,
    save_zarr,
)


@pytest.fixture
def small_dummy_data() -> np.ndarray:
    return generate_dummy_data(num_samples=300000, num_channels=3)


def test_generate_dummy_data_shape_and_dtype() -> None:
    data = generate_dummy_data(num_samples=300000, num_channels=3)
    assert data.shape == (3, 1, 1, 300000)
    assert data.dtype == np.int16


def test_save_zarr_creates_store(small_dummy_data: np.ndarray) -> None:
    with tempfile.TemporaryDirectory() as tmpdir:
        zarr_path = Path(tmpdir) / "test_data.zarr"
        save_zarr(zarr_path, small_dummy_data)
        store = zarr.open(str(zarr_path), mode="r")
        assert np.array_equal(store[:], small_dummy_data)
        assert store.shape == small_dummy_data.shape
        assert store.dtype == small_dummy_data.dtype


def test_save_hdf5_creates_file(small_dummy_data: np.ndarray) -> None:
    with tempfile.TemporaryDirectory() as tmpdir:
        hdf5_path = Path(tmpdir) / "test_data.h5"
        save_hdf5(hdf5_path, small_dummy_data)
        assert hdf5_path.exists()
        with h5py.File(hdf5_path, "r") as f:
            dset = f["data"]
            assert dset.shape == small_dummy_data.shape
            assert dset.dtype == small_dummy_data.dtype
            assert np.array_equal(dset[:], small_dummy_data)
