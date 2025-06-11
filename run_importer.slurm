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
