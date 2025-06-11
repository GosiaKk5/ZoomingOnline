# ZoomingOnline

## s3 configuration step by step

1. Install and configure MinIO client (mc) on your local machine.

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

4. To automate the process via slurm, you can use the zarr_upload.sh script below. Make sure to adjust the paths and credentials accordingly.

```bash
#!/bin/bash
#SBATCH --job-name=zarr-upload
#SBATCH --output=zarr_job.log
#SBATCH --error=zarr_job.err
#SBATCH --ntasks=1
#SBATCH --time=00:15:00
#SBATCH --mem=4G

module load python/3.10.4
source ~/your-venv-path/bin/activate

python3 ~/Documents/studia_sem_8/LSC/projekt/generate_zarr.py

~/.local/bin/mc alias set cyf-s3p https://s3p.cloud.cyfronet.pl ACCESS_KEY SECRET_KEY
~/.local/bin/mc cp --recursive ~/Documents/studia_sem_8/LSC/projekt/sample_dataset.zarr cyf-s3p/zarr-test-iza/
```

5. Submit the job to the Slurm scheduler.

```bash
sbatch zarr_upload.sh
```

## Running application

To run the server serving zarr files, you can use the following command:

```bash
python3 cors_server.py
```

If you don't have zarr file you can create one by seting `CREATE_ZARR_STORE` variable to `True` in the `cors_server.py`
file. This will create a dummy zar file.

Then you can open index.html in your browser to see the data.
