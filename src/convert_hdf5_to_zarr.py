import argparse
from pathlib import Path

import h5py
import zarr


def convert_hdf5_to_zarr(hdf5_file_path: Path, zarr_file_path: Path) -> None:
    if not hdf5_file_path.exists():
        message = f"HDF5 file not found: {hdf5_file_path}"
        raise FileNotFoundError(message)

    with h5py.File(hdf5_file_path, "r") as hdf5_file:
        zarr_group = zarr.open_group(zarr_file_path, mode="w")
        zarr.copy(hdf5_file, zarr_group, name="samples", if_exists="replace")
    print(f"Conversion complete! Zarr file created at: {zarr_file_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert a dataset from HDF5 format to Zarr format.")
    parser.add_argument("--input", "-i", required=True, help="Input HDF5 file (e.g. data.h5)")
    parser.add_argument("--output", "-o", required=True, help="Output Zarr store directory (e.g. data.zarr)")

    args = parser.parse_args()
    convert_hdf5_to_zarr(Path(args.input), Path(args.output))


if __name__ == "__main__":
    main()
