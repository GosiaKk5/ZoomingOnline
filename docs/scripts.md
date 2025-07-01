# 🧰 CLI Script Reference

All CLI tools are in `src/`. This guide describes usage of each script in the ZoomingOnline toolkit.

Run any script with `-h` / `--help` to get inline help:

```bash
python src/<script>.py --help
```

---

## 1️⃣ generate_data.py

Simulate realistic oscilloscope waveform data and export to Zarr or HDF5.

✔️ Use this to generate structured datasets for testing visualization, compression performance, or storage pipelines.

### ✅ Features

- Structured waveform data: shape = (`channels`, `trcs`, `segments`, `samples`)
- Synthetic waveform types: `sine`, `square`, `sawtooth`, `pulse`
- Adds:
    - Random noise, drift, jitter, glitching
    - Injected synthetic event (pulse spike)
- Saves waveform + metadata to Zarr (or raw HDF5)
- Automatically builds visualization-ready overviews using min/max downsampling

### ⚙️ Example Usage

```bash
# Generate and save to Zarr
python src/generate_data.py -o output.zarr --channels 2 --samples 1e8

# Generate and save to HDF5
python src/generate_data.py -o output.h5 --signal square --segments 2
```

### 📐 Data Shape

Default shape:

```python
(channels=2, trcs=1, segments=3, samples=100_000_000)
```

| Axis         | Meaning                      |
|--------------|------------------------------|
| 0 (channels) | Oscilloscope input channels  |
| 1 (trcs)     | "TRC" captures or sessions   |
| 2 (segments) | Segmented waveform sequences |
| 3 (samples)  | Time samples per segment     |

Chunking: (1, 1, 1, 100_000)

### 💾 Output Structure

| Format | Dataset Name | Compression    | Includes Metadata                      | Overview                     |
|--------|--------------|----------------|----------------------------------------|------------------------------|
| Zarr   | raw          | Blosc-Zstd     | yes: horizontal interval, gain, offset | ✅ (min/max over sample axis) |
| HDF5   | data         | Gzip (level 4) | ❌ only raw waveform                    | ❌                            |

Zarr metadata saved under root.attrs, e.g.:

```python
z.attrs["horiz_interval"]
z.attrs["vertical_gains"]
z.attrs["vertical_offsets"]
```

Zarr includes a downsampled version for quick lookups:

```bash
z["overview"]["0"][channel, trc, segment, stat, :]

# where stat = 0 (min), stat = 1 (max)
```

---

### Command-line options:

| Flag             | Description                                         |
|------------------|-----------------------------------------------------|
| `-o`, `--output` | Output path (`.zarr`, `.h5`)                        |
| `--samples`      | Samples per segment (default: 100,000,000)          |
| `--channels`     | Number of channels (default: 2)                     |
| `--trcs`         | Number of TRC captures (default: 1)                 |
| `--segments`     | Segments per TRC (default: 3)                       |
| `--signal`       | Signal shape: `sine`, `square`, `sawtooth`, `pulse` |

---

## 2️⃣ convert_hdf5_to_zarr.py

Convert an existing HDF5 file containing waveform data into a multi-resolution Zarr store with metadata and
visualization-friendly downsampling.

### ✅ Key Features

- Converts HDF5 file (must include dataset named `data`)
- Outputs `raw` waveform data and `overview/0` min/max overview
- Stores metadata in Zarr root.attrs
- Overview is optimized for ~4000-pixel wide visualization

### ⚙️ Example:

```bash
python src/convert_hdf5_to_zarr.py -i input.h5 -o output.zarr
```

### 🧭 Output Structure:

| Zarr Group  | Content                                |
|-------------|----------------------------------------|
| /raw        | Original waveform samples              |
| /overview/0 | Downsampled min/max (shape: ..., 2, N) |
| attrs       | horizontal interval, gains, offsets    |

### ⚠️ HDF5 Requirements

- Must include dataset: `/data`
    - Expected shape: (channels, trcs, segments, samples)
- Attributes copied from HDF5 root (if any)

### Flags

| Flag             | Description                   |
|------------------|-------------------------------|
| `-i`, `--input`  | Path to input `.h5` file      |
| `-o`, `--output` | Output path for `.zarr` store |

---

## 3️⃣ data_to_s3_importer.py

Batch convert multiple `.h5` waveform files inside a directory to Zarr, and optionally upload to an S3-compatible object
store.

✔️ Good for loading waveform archives into online object stores with conversion + compression support.

### ⚙️ Example:

```bash
python src/data_to_s3_importer.py data/
```

### Flags

| Flag          | Description                 |
|---------------|-----------------------------|
| --bucket      | Target S3 bucket name       |
| --skip-upload | Run conversion locally only |

Supports S3 credentials via environment or CLI override.

---

## 4️⃣ cors_server.py

Lightweight development HTTP server with CORS enabled. Useful for previewing Zarr data in browser-based tools.

### ⚙️ Example:

```bash
python src/cors_server.py --port 8080
```

Open at: http://localhost:8080

### Flags:

| Flag         | Description                   |
|--------------|-------------------------------|
| --port, `-p` | Port to serve (default: 8000) |
