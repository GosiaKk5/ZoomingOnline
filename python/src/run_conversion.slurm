#!/bin/bash
#SBATCH --job-name=convert_upload
#SBATCH --output=logs/%x-%j.out
#SBATCH --error=logs/%x-%j.err
#SBATCH --time=01:00:00
#SBATCH --mem=16G
#SBATCH --cpus-per-task=4
#SBATCH --partition=plgrid

module load python/3.11
source ~/.bashrc
source ~/ZoomingOnline/.venv/bin/activate
cd ~/ZoomingOnline

if [ -z "$1" ]; then
  echo "❌ Usage: sbatch run_conversion.slurm /path/to/file.hdf"
  exit 1
fi

HDF_FILE="$1"

if [ ! -f "$HDF_FILE" ]; then
  echo "❌ File doesn't exist: $HDF_FILE"
  exit 2
fi

OUTPUT_DIR="/net/people/plgrid/plgizabellarosikon/ZoomingOnline/tests"
BUCKET_NAME="zooming-online"

python3 -m src.data_to_s3_importer \
  --input "$HDF_FILE" \
  --output-dir "$OUTPUT_DIR" \
  --bucket "$BUCKET_NAME"
