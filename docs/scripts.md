# 🧰 CLI Script Reference

All CLI tools are in src/. This guide describes usage of each script in the ZoomingOnline toolkit.

Run any script with -h / --help to get inline help:

```bash
python src/<script>.py --help
```

## 1️⃣ generate_data.py

Generate large synthetic int16 waveform signals.

✅ Supports output to Zarr or HDF5 formats.

### Example:

```bash
python src/generate_data.py -o synthetic_data.zarr
```

### Flags:

| Flag          | Description                               |
|---------------|-------------------------------------------|
| -o, --output  | Output file (.zarr or .h5)                |
| -n, --samples | Number of samples (default = 100_000_000) |

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


