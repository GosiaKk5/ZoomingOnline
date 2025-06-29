import argparse
import shutil
from pathlib import Path

import h5py
import numcodecs
import numpy as np
import zarr


def generate_dummy_data(num_samples: int = int(1e8), num_channels: int = 3) -> np.ndarray:
    horiz_interval = 2e-9
    gain = 1e-4
    offset = -0.2

    time_s = np.arange(num_samples) * horiz_interval
    rng = np.random.default_rng()
    voltage_v = rng.normal(0, 0.01, size=num_samples)
    voltage_v += 0.1 * np.sin(2 * np.pi * 5e3 * time_s)

    feature_start_idx = int(443.5e-6 / horiz_interval)
    feature_end_idx = int(443.75e-6 / horiz_interval)
    feature_len = feature_end_idx - feature_start_idx
    feature_time = np.linspace(0, 20, feature_len)
    feature_signal = -0.05 * np.exp(-feature_time) * np.sin(2 * np.pi * 50 * feature_time)
    voltage_v[feature_start_idx:feature_end_idx] += feature_signal

    samples_adc = np.zeros((num_channels, 1, 1, num_samples), dtype="int16")
    for ch in range(num_channels):
        ch_offset = ch * 0.05
        adc = (voltage_v + ch_offset + offset) / gain
        samples_adc[ch, 0, 0, :] = adc.astype("int16")

    return samples_adc


def save_zarr(path: Path, data: np.ndarray) -> None:
    if path.exists():
        shutil.rmtree(path)
    compressor = numcodecs.Blosc(cname="zstd", clevel=3, shuffle=2)
    store = zarr.open(
        str(path),
        mode="w",
        shape=data.shape,
        chunks=(1, 1, 1, 100000),
        compressor=compressor,
        dtype="int16",
    )
    store[:] = data
    print(f"Saved Zarr store at: {path}")


def save_hdf5(path: Path, data: np.ndarray) -> None:
    if path.exists():
        print(f"Overwriting existing file: {path}")
        path.unlink()
    with h5py.File(path, "w") as f:
        f.create_dataset("data", data=data, chunks=(1, 1, 1, 100000), compression="gzip", compression_opts=4)
    print(f"Saved HDF5 file at: {path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate dummy oscilloscope-like waveform data")
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        required=True,
        help="Output path (.zarr directory or .h5 file)",
    )
    parser.add_argument(
        "--samples", "-n", type=int, default=int(1e8), help="Number of samples to generate (default: 1e8)"
    )
    args = parser.parse_args()
    output_path = Path(args.output)
    ext = output_path.suffix.lower()

    print(f"Generating dummy data with {args.samples} samples...")
    data = generate_dummy_data(num_samples=args.samples)

    if ext == ".zarr":
        save_zarr(output_path, data)
    elif ext in {".h5", ".hdf5"}:
        save_hdf5(output_path, data)
    else:
        message = f"Unsupported file extension: {ext}. Use .zarr or .h5"
        raise ValueError(message)


if __name__ == "__main__":
    main()
