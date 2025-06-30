import tempfile
from pathlib import Path

import h5py
import numpy as np
import pytest
import zarr

from src.generate_data import (
    generate_realistic_data,
    generate_signal,
    save_hdf5,
    save_zarr,
)


@pytest.fixture
def small_realistic_data() -> tuple[np.ndarray, float, np.ndarray, np.ndarray]:
    return generate_realistic_data(
        num_samples=1000, num_channels=2, num_trc_files=1, num_segments=1, signal_type="sine"
    )


def test_generate_realistic_data_shape_and_dtype() -> None:
    data, horiz_interval, gains, offsets = generate_realistic_data(
        num_samples=1000, num_channels=2, num_trc_files=1, num_segments=1
    )
    assert isinstance(data, np.ndarray)
    assert data.dtype == np.int16
    assert data.shape == (2, 1, 1, 1000)
    assert isinstance(horiz_interval, float)
    assert gains.shape == (2, 1)
    assert offsets.shape == (2, 1)


def test_signal_value_range() -> None:
    data, *_ = generate_realistic_data(num_samples=1000)
    int16_max = np.iinfo(np.int16).max
    int16_min = np.iinfo(np.int16).min
    assert np.all(data >= int16_min)
    assert np.all(data <= int16_max)


@pytest.mark.parametrize("signal_type", ["sine", "square", "sawtooth", "pulse"])
def test_generate_signal_valid(signal_type: str) -> None:
    time = np.linspace(0, 1e-3, 1000)
    signal = generate_signal(signal_type, time)
    assert isinstance(signal, np.ndarray)
    assert signal.shape == (1000,)
    assert np.isfinite(signal).all()


def test_save_zarr_writes_attributes(small_realistic_data: tuple[np.ndarray, float, np.ndarray, np.ndarray]) -> None:
    data, horiz_interval, gains, offsets = small_realistic_data
    with tempfile.TemporaryDirectory() as tmpdir:
        zarr_path = Path(tmpdir) / "sample.zarr"
        save_zarr(zarr_path, data, horiz_interval, gains, offsets)
        store = zarr.open(str(zarr_path), "r")
        assert "horiz_interval" in store.attrs
        assert "vertical_gains" in store.attrs
        assert "vertical_offsets" in store.attrs

        assert np.array_equal(store[:], data)


def test_save_hdf5_creates_file(small_realistic_data: tuple[np.ndarray, float, np.ndarray, np.ndarray]) -> None:
    data, *_ = small_realistic_data
    with tempfile.TemporaryDirectory() as tmpdir:
        h5_path = Path(tmpdir) / "sample.h5"
        save_hdf5(h5_path, data)
        assert h5_path.exists()
        with h5py.File(h5_path, "r") as f:
            dset = f["data"]
            assert dset.shape == data.shape
            assert dset.dtype == data.dtype
            assert np.array_equal(dset[:], data)
