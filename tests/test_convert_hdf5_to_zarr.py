from pathlib import Path

import h5py
import numpy as np
import zarr

from src.convert_hdf5_to_zarr import convert_hdf5_to_zarr


def create_dummy_hdf5_file(file_path: Path) -> np.ndarray:
    rng = np.random.default_rng()
    data = rng.integers(0, 255, size=(1, 1, 1, 1000), dtype=np.uint8)
    with h5py.File(file_path, "w") as f:
        f.create_dataset("data", data=data)
    return data


def test_convert_hdf5_to_zarr(tmp_path: Path) -> None:
    hdf5_path = tmp_path / "data.h5"
    original_data = create_dummy_hdf5_file(hdf5_path)

    zarr_path = tmp_path / "data.zarr"
    convert_hdf5_to_zarr(hdf5_path, zarr_path)

    z = zarr.open_group(str(zarr_path), mode="r")

    assert "raw" in z
    np.testing.assert_array_equal(z["raw"][:], original_data)

    assert "overview" in z
    assert "0" in z["overview"]

    overview = z["overview"]["0"]
    expected_len = original_data.shape[-1] // max(1, original_data.shape[-1] // 4000)
    assert overview.shape == (1, 1, 1, 2, expected_len)

    min_vals = overview[0, 0, 0, 0, :]
    max_vals = overview[0, 0, 0, 1, :]
    assert np.all(min_vals <= max_vals)
