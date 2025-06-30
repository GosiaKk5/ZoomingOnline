# Project Setup Guide

This guide shows you how to set up the ZoomingOnline project using either the recommended uv tool or a fallback pip+venv
environment.

## Prerequisites

- Python 3.11 or newer
- Git
- Web browser
- (Optional) Access to S3-compatible object storage (e.g., MinIO, Cyfronet S3P)

> 📝 Note for Windows users: the h5py package requires HDF5 pre-installed and discoverable on your system. The build
> process for h5py will fail if the HDF5 library (e.g. hdf5.dll) is not accessible. Please ensure you have HDF5 installed
> appropriately (e.g., via conda or from https://www.hdfgroup.org/downloads/hdf5/).

## Option 1: Setup using uv (Recommended)

uv is a fast Python package manager and dependency resolver.

### 1. Install uv

Please follow the uv installation guide: https://docs.astral.sh/uv/getting-started/installation/

### 2. Create .venv and install dependencies via uv

```bash
uv sync
```

This will:

- Automatically create a `.venv/` folder
- Install all dependencies from `pyproject.toml`
- Use `uv.lock` if it exists (for reproducibility)

## Option 2: Setup using pip + venv (Fallback)

If you don’t want to install uv:

### 1. Create and activate a virtual environment

```bash
# macOS / Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

### 2. Install dependencies via pip

```bash
pip install -e .
```

This uses the pyproject.toml metadata for installation.

## S3 configuration step by step

Create `.env` file in the root directory of the project following the example `./examples/.env.template` file. Make sure to set
the `S3_BUCKET_NAME` variable to the name of your bucket, e.g., `zarr-test-iza`.

Install and configure MinIO client (mc) on your local machine (if not already installed).

```bash
mkdir -p ~/.local/bin
curl -fsSL -o ~/.local/bin/mc https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x ~/.local/bin/mc
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Set S3 alias with your credentials:

```bash
mc alias set cyf-s3p https://s3p.cloud.cyfronet.pl ACCESS_KEY SECRET_KEY
```

Upload data to the bucket:

```bash
mc cp --recursive sample_dataset.zarr cyf-s3p/zarr-test-iza/
```

## Importing data from HDF5 format to S3 with conversion to Zarr

To automate the process, you can use the `run_importer.slurm` script below. Make sure to adjust the paths and
credentials accordingly.
It will run a Python script that imports data from HDF5 files and uploads it to the S3 bucket in Zarr format.

```bash
#!/bin/bash
#SBATCH --job-name=import-hdf5
#SBATCH --output=logs/import_%j.log
#SBATCH --error=logs/import_%j.err
#SBATCH --ntasks=1
#SBATCH --time=00:30:00
#SBATCH --mem=8G

module load python/3.10.4

source ~/YOUR_REPO_PATH/venv/bin/activate

python ~/YOUR_REPO_PATH/src/data_to_s3_importer.py ~/YOUR_REPO_PATH/data/

```

Submit the job to the Slurm scheduler:

```bash
sbatch run_importer.slurm
```
