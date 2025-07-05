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

Generate and save to Zarr:

<!-- Check: Run -->

```bash
python src/generate_data.py -o output.zarr --channels 2 --samples 100000000
```

Generate and save to HDF5:

<!-- Check: Run -->

```bash
python src/generate_data.py -o output.h5 --signal square --segments 2
```

### 📐 Data Shape

Default shape:

```python
(channels=2, trcs=1, segments=3, samples=100_000_000)
```

| Axis         | Meaning                      |
| ------------ | ---------------------------- |
| 0 (channels) | Oscilloscope input channels  |
| 1 (trcs)     | "TRC" captures or sessions   |
| 2 (segments) | Segmented waveform sequences |
| 3 (samples)  | Time samples per segment     |

Chunking: (1, 1, 1, 100_000)

### 💾 Output Structure

| Format | Dataset Name | Compression    | Includes Metadata                      | Overview                      |
| ------ | ------------ | -------------- | -------------------------------------- | ----------------------------- |
| Zarr   | raw          | Blosc-Zstd     | yes: horizontal interval, gain, offset | ✅ (min/max over sample axis) |
| HDF5   | data         | Gzip (level 4) | ❌ only raw waveform                   | ❌                            |

Zarr metadata saved under root.attrs, e.g.:

```python
z.attrs["horiz_interval"]
z.attrs["vertical_gains"]
z.attrs["vertical_offsets"]
```

Zarr includes a downsampled version for quick lookups:

```text
z["overview"]["0"][channel, trc, segment, stat, :]

# where stat = 0 (min), stat = 1 (max)
```

---

### Command-line options:

| Flag             | Description                                         |
| ---------------- | --------------------------------------------------- |
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
| ----------- | -------------------------------------- |
| /raw        | Original waveform samples              |
| /overview/0 | Downsampled min/max (shape: ..., 2, N) |
| attrs       | horizontal interval, gains, offsets    |

### ⚠️ HDF5 Requirements

- Must include dataset: `/data`
  - Expected shape: (channels, trcs, segments, samples)
- Attributes copied from HDF5 root (if any)

### Flags

| Flag             | Description                   |
| ---------------- | ----------------------------- |
| `-i`, `--input`  | Path to input `.h5` file      |
| `-o`, `--output` | Output path for `.zarr` store |

---

## 3️⃣ data_to_s3_importer.py

Batch convert `.hdf` waveform files to Zarr format and optionally upload them to an S3-compatible object store using
MinIO Client (`mc`).

✔️ Good for loading waveform archives into online object stores with conversion + compression support.

### ✅ Key Features

- Converts `.hdf` files to `.zarr` format
- Uploads `.zarr` folders to S3 bucket using `mc`
- Supports skipping upload (`--skip-upload`) or keeping local `.zarr` files (`--keep-local`)

### ⚙️ Example:

Convert and upload:

```bash
python src/data_to_s3_importer.py -i input.hdf -o output_dir --bucket my-bucket
```

Convert only (skip upload):

```bash
python src/data_to_s3_importer.py -i input.hdf -o output_dir --skip-upload
```

Batch conversion using Slurm:

```bash
sbatch src/run_conversion.slurm /path/to/file.hdf
```

### Flags

| Flag                 | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `-i`, `--input`      | Path to `.hdf` file                                   |
| `-o`, `--output-dir` | Local directory for `.zarr` output                    |
| `--bucket`           | Target S3 bucket name (overrides `.env`)              |
| `--skip-upload`      | Run conversion locally only                           |
| `--keep-local`       | Keep local `.zarr` after successful upload            |
| `--mc-alias`         | MinIO Client alias for S3 endpoint (default: cyf-s3p) |

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
| ------------ | ----------------------------- |
| --port, `-p` | Port to serve (default: 8000) |
