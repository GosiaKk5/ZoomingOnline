import argparse
from pathlib import Path

import h5py
import numcodecs
import numpy as np
import zarr


def create_overview(data_slice: np.ndarray, downsampling_factor: int) -> np.ndarray:
    num_points_fit = len(data_slice) - (len(data_slice) % downsampling_factor)
    reshaped = data_slice[:num_points_fit].reshape(-1, downsampling_factor)
    max_values = np.max(reshaped, axis=1)
    min_values = np.min(reshaped, axis=1)
    return np.stack([min_values, max_values])


def convert_hdf5_to_zarr(hdf5_file_path: Path, zarr_file_path: Path) -> None:
    if not hdf5_file_path.exists():
        message = f"HDF5 file not found: {hdf5_file_path}"
        raise FileNotFoundError(message)

    print(f"Opening HDF5 file: {hdf5_file_path}")
    with h5py.File(hdf5_file_path, "r") as hdf5_file:
        if "samples" not in hdf5_file:
            message = "HDF5 file must contain a dataset named 'samples'"
            raise KeyError(message)

        data = hdf5_file["samples"]

        root = zarr.open_group(str(zarr_file_path), mode="w")

        for key, value in hdf5_file.attrs.items():
            root.attrs[key] = value

        chunk_size = 10_000_000
        compressor = numcodecs.Blosc(cname="zstd", clevel=3, shuffle=numcodecs.Blosc.BITSHUFFLE)

        print("Copying raw data...")
        raw = root.create_dataset(
            "raw", shape=data.shape, chunks=(1, 1, 1, chunk_size), compressor=compressor, dtype=data.dtype
        )

        for ch in range(data.shape[0]):
            for trc in range(data.shape[1]):
                for seg in range(data.shape[2]):
                    print(f"  - Copying: ch={ch + 1}, trc={trc + 1}, seg={seg + 1}")
                    raw[ch, trc, seg, :] = data[ch, trc, seg, :]

        print("Pre-calculating and saving overviews...")
        overview_group = root.create_group("overview")

        downsampling_factor = max(1, data.shape[-1] // 4000)
        overview_shape = (*data.shape[:-1], 2, data.shape[-1] // downsampling_factor)
        overview_data = overview_group.create_dataset(
            "0", shape=overview_shape, chunks=(1, 1, 1, 2, overview_shape[-1]), dtype=data.dtype
        )

        for ch in range(data.shape[0]):
            for trc in range(data.shape[1]):
                for seg in range(data.shape[2]):
                    print(f"  - Calculating overview for: Chan {ch + 1}, TRC {trc + 1}, Seg {seg + 1}")
                    data_slice = data[ch, trc, seg, :]
                    overview_slice = create_overview(data_slice, downsampling_factor)
                    overview_data[ch, trc, seg, :, :] = overview_slice

    print(f"Conversion complete! Zarr created at: {zarr_file_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert an HDF5 dataset to a multi-resolution Zarr pyramid.")
    parser.add_argument("--input", "-i", required=True, help="Input HDF5 file (e.g. data.h5)")
    parser.add_argument(
        "--output-dir", "-o", required=True, help="Output directory for Zarr store (e.g. /output/path/)"
    )

    args = parser.parse_args()

    input_path = Path(args.input)
    output_dir = Path(args.output_dir)

    zarr_filename = input_path.with_suffix(".zarr").name
    zarr_output_path = output_dir / zarr_filename

    convert_hdf5_to_zarr(input_path, zarr_output_path)


if __name__ == "__main__":
    main()
