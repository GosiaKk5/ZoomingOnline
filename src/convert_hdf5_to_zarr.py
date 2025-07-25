#!/usr/bin/env python3

import argparse
import os
from pathlib import Path

import h5py
import numpy as np
import zarr

# Set zarr v3 experimental API before any zarr operations
os.environ["ZARR_V3_EXPERIMENTAL_API"] = "1"


def create_overview(data_slice: np.ndarray, downsampling_factor: int) -> np.ndarray:
    n_fit = len(data_slice) - (len(data_slice) % downsampling_factor)
    reshaped = data_slice[:n_fit].reshape(-1, downsampling_factor)
    return np.stack([np.min(reshaped, axis=1), np.max(reshaped, axis=1)])


def ensure_required_attrs(root: zarr.Group, n_channels: int) -> None:
    defaults = {
        "vertical_gains": [1.0] * n_channels,
        "vertical_offsets": [0.0] * n_channels,
        "horiz_interval": 1e-9,
    }
    for key, val in defaults.items():
        if key not in root.attrs:
            root.attrs[key] = val
            print(f"ℹ️  Added missing attr: {key} = {val}")  # noqa: RUF001


def convert_hdf5_to_zarr(hdf_path: Path, zarr_path: Path) -> None:  # noqa: C901, PLR0912
    if not hdf_path.exists():
        error_message = f"❌ Input file not found: {hdf_path}"
        raise FileNotFoundError(error_message)

    print(f"📂 Opening HDF5: {hdf_path}")
    with h5py.File(hdf_path, "r") as h5:
        if "samples" not in h5:
            message = f"❌ No 'samples' dataset found in HDF5 file: {hdf_path}."
            raise KeyError(message)

        data = h5["samples"]
        # Use zarr v3 format if available, otherwise fallback to v2
        try:
            # Try zarr v3 format first
            root = zarr.open_group(str(zarr_path), mode="w", zarr_format=3)
        except TypeError:
            # Fallback to zarr v2 format for older zarr versions
            root = zarr.open_group(str(zarr_path), mode="w")

        for k, v in h5.attrs.items():
            try:
                root.attrs[k] = v.tolist() if hasattr(v, "tolist") else v
            except Exception as e:  # noqa: BLE001
                print(f"⚠️  Skipped attr {k}: {e}")

        if "vertical_gain" in h5:
            root.attrs["vertical_gains"] = h5["vertical_gain"][:].tolist()
        if "vertical_offset" in h5:
            root.attrs["vertical_offsets"] = h5["vertical_offset"][:].tolist()
        if "horiz_offset" in h5:
            offset = h5["horiz_offset"][:]
            root.attrs["horiz_offset"] = offset.tolist() if offset.ndim > 0 else float(offset)

        ensure_required_attrs(root, n_channels=data.shape[0])

        chunk_size = 10_000_000
        print("📦 Creating dataset 'raw'...")
        try:
            # Try zarr v3 compression format
            raw = root.create_array(
                "raw",
                shape=data.shape,
                chunks=(1, 1, 1, chunk_size),
                compressors=[{"name": "blosc", "configuration": {"cname": "zstd", "clevel": 3, "shuffle": "bitshuffle"}}],
                dtype=data.dtype,
            )
        except (TypeError, ValueError, AttributeError):
            # Fallback to zarr v2 compression format
            import numcodecs
            compressor = numcodecs.Blosc(cname="zstd", clevel=3, shuffle=numcodecs.Blosc.BITSHUFFLE)
            raw = root.create_dataset(
                "raw",
                shape=data.shape,
                chunks=(1, 1, 1, chunk_size),
                compressor=compressor,
                dtype=data.dtype,
            )

        for ch in range(data.shape[0]):
            for trc in range(data.shape[1]):
                for seg in range(data.shape[2]):
                    print(f"  • Coping raw: ch={ch + 1}, trc={trc + 1}, seg={seg + 1}")
                    raw[ch, trc, seg, :] = data[ch, trc, seg, :]

        print("🔍 Generating overview (0)...")
        ov_group = root.create_group("overview")
        downsample = max(1, data.shape[-1] // 4000)
        ov_shape = (*data.shape[:-1], 2, data.shape[-1] // downsample)
        try:
            # Try zarr v3 compression format
            overview = ov_group.create_array("0", shape=ov_shape, chunks=(1, 1, 1, 2, ov_shape[-1]), dtype=data.dtype, compressors=[{"name": "blosc", "configuration": {"cname": "zstd", "clevel": 3, "shuffle": "bitshuffle"}}])
        except (TypeError, ValueError, AttributeError):
            # Fallback to zarr v2 compression format
            import numcodecs
            compressor = numcodecs.Blosc(cname="zstd", clevel=3, shuffle=numcodecs.Blosc.BITSHUFFLE)
            overview = ov_group.create_dataset("0", shape=ov_shape, chunks=(1, 1, 1, 2, ov_shape[-1]), dtype=data.dtype, compressor=compressor)

        for ch in range(data.shape[0]):
            for trc in range(data.shape[1]):
                for seg in range(data.shape[2]):
                    overview[ch, trc, seg, :, :] = create_overview(data[ch, trc, seg, :], downsample)

    print(f"✅ Done! Saved: {zarr_path} (zarr v3 format, compatible with zarrita.js)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Conversion HDF5 → Zarr (overview + metadata).")
    parser.add_argument("-i", "--input", required=True, help="Input file .hdf")
    parser.add_argument("-o", "--output-dir", required=True, help="Output dir for .zarr")
    args = parser.parse_args()

    hdf_path = Path(args.input).expanduser().resolve()
    out_dir = Path(args.output_dir).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    zarr_path = out_dir / hdf_path.with_suffix(".zarr").name
    convert_hdf5_to_zarr(hdf_path, zarr_path)


if __name__ == "__main__":
    main()
