import argparse
import shutil
from pathlib import Path

import h5py
import numpy as np
import zarr
import numcodecs
from numpy.random import Generator


def generate_signal(signal_type: str, time_s: np.ndarray, freq_hz: float = 50.0) -> np.ndarray:
    if signal_type == "sine":
        return 0.1 * np.sin(2 * np.pi * freq_hz * time_s)
    if signal_type == "square":
        return 0.1 * np.sign(np.sin(2 * np.pi * freq_hz * time_s))
    if signal_type == "sawtooth":
        return 0.1 * (2 * (time_s * freq_hz - np.floor(0.5 + time_s * freq_hz)))
    if signal_type == "pulse":
        period = 1 / freq_hz
        pulse_width = period / 20
        phase = time_s % period
        return np.where(phase < pulse_width, 0.2, 0.0)
    message = f"Unknown signal type: {signal_type}"
    raise ValueError(message)


def add_feature(voltage_v: np.ndarray, time_s: np.ndarray) -> np.ndarray:
    horiz_interval = time_s[1] - time_s[0] if len(time_s) > 1 else 2e-9
    feature_start_idx = int(443.5e-6 / horiz_interval)
    feature_end_idx = int(443.75e-6 / horiz_interval)
    if feature_end_idx > len(voltage_v):
        return voltage_v

    feature_len = feature_end_idx - feature_start_idx
    feature_time = np.linspace(0, 20, feature_len)
    feature_signal = -0.05 * np.exp(-feature_time) * np.sin(2 * np.pi * 50 * feature_time)
    voltage_v[feature_start_idx:feature_end_idx] += feature_signal
    return voltage_v


def add_glitches(voltage_v: np.ndarray, num_glitches: int, rng: Generator) -> np.ndarray:
    for _ in range(num_glitches):
        idx = rng.integers(0, len(voltage_v))
        polarity = rng.choice([-1, 1])
        amplitude = rng.uniform(0.05, 0.15)
        voltage_v[idx] += polarity * amplitude
    return voltage_v


def add_dc_drift(voltage_v: np.ndarray, time_s: np.ndarray) -> np.ndarray:
    drift = 0.01 * np.sin(2 * np.pi * 0.1 * time_s) + 0.005 * np.sin(2 * np.pi * 0.5 * time_s)
    return voltage_v + drift


def generate_realistic_data(
    num_samples: int = int(1e6),
    num_channels: int = 3,
    num_trc_files: int = 2,
    num_segments: int = 5,
    signal_type: str = "sine",
) -> tuple[np.ndarray, float, np.ndarray, np.ndarray]:
    horiz_interval = 2e-9
    base_gain = 1e-4
    base_offset = -0.2

    vertical_gains = np.zeros((num_channels, num_trc_files), dtype="float32")
    vertical_offsets = np.zeros((num_channels, num_trc_files), dtype="float32")

    samples_adc = np.zeros((num_channels, num_trc_files, num_segments, num_samples), dtype="int16")
    rng = np.random.default_rng()

    print("Generating data for each Channel, TRC File, and Segment...")
    for ch in range(num_channels):
        for trc in range(num_trc_files):
            gain = base_gain * rng.uniform(0.98, 1.02)
            offset = base_offset + rng.uniform(-0.01, 0.01)
            vertical_gains[ch, trc] = gain
            vertical_offsets[ch, trc] = offset

            for seg in range(num_segments):
                time_s = np.arange(num_samples) * horiz_interval

                jitter = rng.normal(0, horiz_interval * 0.05, size=num_samples)
                time_s_jittered = time_s + jitter

                voltage_v = generate_signal(signal_type, time_s_jittered)

                voltage_v = add_feature(voltage_v, time_s)

                voltage_v = add_dc_drift(voltage_v, time_s)

                noise = rng.normal(0, 0.01, size=num_samples)
                voltage_v += noise

                voltage_v = add_glitches(voltage_v, num_glitches=3, rng=rng)

                ch_offset = ch * 0.05

                adc = (voltage_v + ch_offset + offset) / gain
                samples_adc[ch, trc, seg, :] = np.clip(adc, -32768, 32767).astype("int16")

                print(f"  - Generated: Chan {ch + 1}, TRC {trc + 1}, Seg {seg + 1}")

    return samples_adc, horiz_interval, vertical_gains, vertical_offsets


def create_overview(data_slice: np.ndarray, downsampling_factor: int) -> np.ndarray:
    num_points_fit = len(data_slice) - (len(data_slice) % downsampling_factor)
    reshaped = data_slice[:num_points_fit].reshape(-1, downsampling_factor)
    max_values = np.max(reshaped, axis=1)
    min_values = np.min(reshaped, axis=1)
    return np.stack([min_values, max_values])


def save_zarr(
    path: Path,
    data: np.ndarray,
    horiz_interval: float,
    vertical_gains: np.ndarray,
    vertical_offsets: np.ndarray,
) -> None:
    if path.exists():
        print(f"Overwriting existing Zarr store: {path}")
        shutil.rmtree(path)

    # Explicitly specify zarr_version=2 for compatibility with browser client
    root = zarr.group(store=str(path), zarr_version=2)
    root.attrs["horiz_interval"] = horiz_interval
    root.attrs["vertical_gains"] = vertical_gains.tolist()
    root.attrs["vertical_offsets"] = vertical_offsets.tolist()

    # Create raw data array with blosc compression - use create_dataset with explicit shape
    blosc_compressor = numcodecs.Blosc(cname='zstd', clevel=5, shuffle=numcodecs.Blosc.BITSHUFFLE)
    root.create_dataset(
        "raw", 
        shape=data.shape, 
        dtype=data.dtype, 
        data=data, 
        chunks=(1, 1, 1, 100_000),
        compressor=blosc_compressor  # Using blosc with zstd and bit-shuffle
    )

    print("Pre-calculating and saving overviews...")
    overview_group = root.create_group("overview")

    downsampling_factor = max(1, data.shape[-1] // 4000)

    overview_shape = (*data.shape[:-1], 2, data.shape[-1] // downsampling_factor)
    # Create overview array
    overview_data = np.zeros(overview_shape, dtype="int16")
    for ch in range(data.shape[0]):
        for trc in range(data.shape[1]):
            for seg in range(data.shape[2]):
                print(f"  - Calculating overview for: Chan {ch + 1}, TRC {trc + 1}, Seg {seg + 1}")
                overview_slice = create_overview(data[ch, trc, seg, :], downsampling_factor)
                overview_data[ch, trc, seg, :, :] = overview_slice

    # Store the data - use create_dataset with explicit shape for zarr v2 compatibility
    overview_group.create_dataset(
        "0",
        shape=overview_data.shape,
        dtype=overview_data.dtype,
        data=overview_data,
        chunks=(1, 1, 1, 2, overview_shape[-1]),
        compressor=blosc_compressor  # Using blosc with zstd and bit-shuffle
    )

    print(f"Saved Zarr store at: {path}")


def save_hdf5(path: Path, data: np.ndarray) -> None:
    if path.exists():
        print(f"Overwriting existing file: {path}")
        path.unlink()
    with h5py.File(path, "w") as f:
        f.create_dataset(
            "data",
            data=data,
            compression="gzip",
            compression_opts=4,
        )
    print(f"Saved HDF5 file with shape {data.shape} at: {path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate realistic dummy oscilloscope waveform data")
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default="output.zarr",
        help="Output path (.zarr directory or .h5 file)",
    )
    parser.add_argument("--samples", type=int, default=int(1e8), help="Number of samples per segment")
    parser.add_argument("--channels", type=int, default=2, help="Number of channels")
    parser.add_argument("--trcs", type=int, default=1, help="Number of TRC files")
    parser.add_argument("--segments", type=int, default=3, help="Number of segments")
    parser.add_argument(
        "--signal",
        type=str,
        default="sine",
        choices=["sine", "square", "sawtooth", "pulse"],
        help="Base signal type",
    )
    parser.add_argument(
        "--minimal",
        action="store_true",
        help="Generate a minimal dataset for quick testing (overrides other size parameters)",
    )
    args = parser.parse_args()
    output_path = Path(args.output)
    ext = output_path.suffix.lower()

    # If minimal flag is set, override with minimal parameters
    if args.minimal:
        args.samples = 1000000  # 1M samples instead of 100M
        args.channels = 2
        args.trcs = 3
        args.segments = 5
        print("Generating minimal dataset for quick testing")

    print(f"Generating data with shape: ({args.channels}, {args.trcs}, {args.segments}, {args.samples})")
    data, horiz_interval, vertical_gains, vertical_offsets = generate_realistic_data(
        num_samples=args.samples,
        num_channels=args.channels,
        num_trc_files=args.trcs,
        num_segments=args.segments,
        signal_type=args.signal,
    )

    if ext == ".zarr":
        save_zarr(output_path, data, horiz_interval, vertical_gains, vertical_offsets)
    elif ext in {".h5", ".hdf5"}:
        save_hdf5(output_path, data)
    else:
        message = f"Unsupported file extension: {ext}. Use .zarr or .h5"
        raise ValueError(message)


if __name__ == "__main__":
    main()
