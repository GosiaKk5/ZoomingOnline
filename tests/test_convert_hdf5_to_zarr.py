from pathlib import Path

import h5py
import numpy as np
import zarr

from src.convert_hdf5_to_zarr import convert_hdf5_to_zarr


def create_dummy_hdf5_file(file_path: Path) -> None:
    rng = np.random.default_rng()
    with h5py.File(file_path, "w") as f:
        data = rng.integers(0, 255, size=(3, 1000), dtype=np.uint8)
        f.create_dataset("samples", data=data)


def test_convert_hdf5_to_zarr(tmp_path: Path) -> None:
    hdf5_path = tmp_path / "data.h5"
    create_dummy_hdf5_file(hdf5_path)

    zarr_path = tmp_path / "data.zarr"
    convert_hdf5_to_zarr(hdf5_path, zarr_path)

    z = zarr.open_group(str(zarr_path), mode="r")
    assert "samples" in z
    data_from_zarr = z["samples"]["samples"][:]

    with h5py.File(hdf5_path, "r") as f:
        data_from_hdf5 = f["samples"][:]

    assert np.array_equal(data_from_zarr, data_from_hdf5)
