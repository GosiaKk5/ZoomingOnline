# ZoomingOnline

## Prerequisites

- Python 3.10 or higher
- Access to a MinIO server (e.g., Cyfronet S3P)

## Project setup

1. Clone the repository.
2. Navigate to the project directory.
3. Install virtual environment and activate it.

```bash
# For Linux/MacOS
python3 -m venv venv

source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

# For Windows
python -m venv venv
venv\Scripts\activate

pip install --upgrade pip
pip install -r requirements.txt
```

4. Create `.env` file in the root directory of the project following the example `.env.template` file. Make sure to set the `S3_BUCKET_NAME` variable to the name of your bucket, e.g., `zarr-test-iza`.

## S3 configuration step by step

1. Install and configure MinIO client (mc) on your local machine (if not already installed).

```bash
mkdir -p ~/.local/bin
curl -fsSL -o ~/.local/bin/mc https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x ~/.local/bin/mc
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

2. Set s3 alias with your credentials.

```bash
mc alias set cyf-s3p https://s3p.cloud.cyfronet.pl ACCESS_KEY SECRET_KEY
```

3. Upload data to the bucket.

```bash
mc cp --recursive sample_dataset.zarr cyf-s3p/zarr-test-iza/
```

## Importing data from HDF5 format to S3 with conversion to Zarr

To automate the process, you can use the `run_importer.slurm` script below. Make sure to adjust the paths and credentials accordingly.
It will run a Python script that imports data from HDF5 files and uploads it to the S3 bucket in Zarr format. The conversion is done using the `hdf5_to_zarr_importer`.

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

python ~/YOUR_REPO_PATH/data_to_s3_importer.py ~/YOUR_REPO_PATH/data/

```

5. Submit the job to the Slurm scheduler.

```bash
sbatch run_importer.slurm
```

## Running application

To run the server serving zarr files, you can use the following command:

```bash
python3 cors_server.py
```

If you don't have zarr file you can create one by seting `CREATE_ZARR_STORE` variable to `True` in the `cors_server.py`
file. This will create a dummy zar file.

Then you can open index.html in your browser to see the data.
