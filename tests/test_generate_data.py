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
        num_samples=1000, num_channels=2, num_trc_files=3, num_segments=5, signal_type="sine"
    )


def test_generate_realistic_data_shape_and_dtype() -> None:
    data, horiz_interval, gains, offsets = generate_realistic_data(
        num_samples=1000, num_channels=2, num_trc_files=3, num_segments=5
    )
    assert isinstance(data, np.ndarray)
    assert data.dtype == np.int16
    assert data.shape == (2, 3, 5, 1000)
    assert isinstance(horiz_interval, float)
    assert gains.shape == (2, 3)
    assert offsets.shape == (2, 3)


def test_signal_value_range() -> None:
    data, _, _, _ = generate_realistic_data(num_samples=1000)
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
        # Use the updated API for zarr v3
        store = zarr.open_group(store=str(zarr_path))
        assert "horiz_interval" in store.attrs
        assert "vertical_gains" in store.attrs
        assert "vertical_offsets" in store.attrs
        np.testing.assert_array_equal(store["raw"][:], data)


def test_save_zarr_creates_overview(small_realistic_data: tuple[np.ndarray, float, np.ndarray, np.ndarray]) -> None:
    data, horiz_interval, gains, offsets = small_realistic_data
    with tempfile.TemporaryDirectory() as tmpdir:
        zarr_path = Path(tmpdir) / "with_overview.zarr"
        save_zarr(zarr_path, data, horiz_interval, gains, offsets)

        # Use the updated API for zarr v3
        root = zarr.open_group(store=str(zarr_path))
        assert "overview" in root
        assert "0" in root["overview"]

        overview = root["overview"]["0"]
        expected_len = data.shape[-1] // max(1, data.shape[-1] // 4000)
        assert overview.shape == (2, 3, 5, 2, expected_len)

        # Check compression on both raw and overview arrays
        assert root["raw"].compressor is not None
        assert "blosc" in str(root["raw"].compressor).lower()

        assert root["overview"]["0"].compressor is not None
        assert (
            "blosc" in str(root["overview"]["0"].compressor).lower()
        )  # Test values from second channel, second TRC, third segment (channels/TRCs/segments are 0-indexed)
        min_vals = overview[1, 1, 2, 0, :]
        max_vals = overview[1, 1, 2, 1, :]
        assert np.all(min_vals <= max_vals)


def test_save_hdf5_creates_file(small_realistic_data: tuple[np.ndarray, float, np.ndarray, np.ndarray]) -> None:
    data, _, _, _ = small_realistic_data
    with tempfile.TemporaryDirectory() as tmpdir:
        h5_path = Path(tmpdir) / "sample.h5"
        save_hdf5(h5_path, data)
        assert h5_path.exists()
        with h5py.File(h5_path, "r") as f:
            dset = f["data"]
            assert dset.shape == data.shape
            assert dset.dtype == data.dtype
            np.testing.assert_array_equal(dset[:], data)
