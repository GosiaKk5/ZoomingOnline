# 🧰 CLI Script Reference

All CLI tools are in src/. This guide describes usage of each script in the ZoomingOnline toolkit.

Run any script with -h / --help to get inline help:

```bash
python src/<script>.py --help
```

## 1️⃣ generate_data.py

Simulate realistic oscilloscope waveform data and export to Zarr or HDF5.

✔️ Use for testing downstream pipelines, visualization, or storage behavior with large-scale structured time series.

### ✅ Features

- Structured waveform data: shape = (channels, trcs, segments, samples)
- Supports multiple signal types: sine, square, sawtooth, pulse
- Adds:
    - Random timing jitter
    - Glitches (random spikes)
    - Embedded synthetic event (simulated pulse)
    - DC drift
    - Gaussian noise
- Embeds physical metadata: horizontal interval, gain, offset (in Zarr attributes)

### ⚙️ Example Usage

```bash
# Generate 100M-sample sine signal with 2 channels and save as Zarr
python src/generate_data.py -o output.zarr --channels 2 --samples 1e8

# Generate HDF5 with sawtooth wave, 3 segments
python src/generate_data.py -o output.h5 --signal sawtooth --segments 3
```

### 📐 Data Shape

Default shape:

```python
(channels=2, trcs=1, segments=3, samples=100_000_000)
```

Dimensions:

| Axis         | Meaning                         |
|--------------|---------------------------------|
| 0 (channels) | Oscilloscope input channels     |
| 1 (trcs)     | "TRC" files (e.g. recordings)   |
| 2 (segments) | Repeated waveform segments      |
| 3 (samples)  | Time-domain samples per segment |

Chunking: (1, 1, 1, 100_000) — efficient slicing along sample axis

### 💾 Output Format + Metadata

| Format | Compression    | Includes Attributes          |
|--------|----------------|------------------------------|
| Zarr   | Blosc-Zstd     | horiz_interval, gain, offset |
| HDF5   | Gzip (level 4) | No metadata (raw array)      |

---

### Flags:

| Flag         | Description                                       |
|--------------|---------------------------------------------------|
| -o, --output | Output file path (.zarr or .h5)                   |
| --samples    | Samples per segment (default: 100_000_000)        |
| --channels   | Number of input channels (default: 2)             |
| --trcs       | Number of TRC (recording) files (default: 1)      |
| --segments   | Segments per channel (default: 3)                 |
| --signal     | Base waveform type: sine, square, sawtooth, pulse |

## 2️⃣ convert_hdf5_to_zarr.py

Convert a single HDF5 file (.h5) to Zarr format.

### Example:

```bash
python src/convert_hdf5_to_zarr.py -i input.h5 -o output.zarr
```

### Flags:

| Flag         | Description                   |
|--------------|-------------------------------|
| -i, --input  | Path to input HDF5 file (.h5) |
| -o, --output | Output Zarr store             |

## 3️⃣ data_to_s3_importer.py

Batch convert .h5 files in a directory to Zarr and upload to S3-compatible storage.

✔️ Uses .env or CLI overrides for credentials.

### Example:

```bash
python src/data_to_s3_importer.py data/
```

### Flags:

| Flag          | Description               |
|---------------|---------------------------|
| --bucket      | Target S3 bucket          |
| --skip-upload | Convert without uploading |

## 4️⃣ cors_server.py

Serve local files (e.g., .zarr) via CORS-enabled HTTP on localhost.

### Example:

```bash
python src/cors_server.py
```

### Flags:

| Flag       | Description                   |
|------------|-------------------------------|
| --port, -p | Port to serve (default: 8000) |


