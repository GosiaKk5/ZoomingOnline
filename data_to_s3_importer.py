import os
import argparse
import importlib.util
from dotenv import load_dotenv
import shutil
import zarr
import s3fs
import boto3
from botocore.config import Config
from pathlib import Path

load_dotenv()

ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "zarr-test-iza")

spec = importlib.util.spec_from_file_location("main", "./hdf5_to_zarr_converter/main.py")
main = importlib.util.module_from_spec(spec)
spec.loader.exec_module(main)

parser = argparse.ArgumentParser(description="Convert .h5 files to Zarr and upload to S3.")
parser.add_argument("input_folder", help="Folder with .h5 files")
args = parser.parse_args()

input_folder = Path(args.input_folder)

session = boto3.session.Session()

s3 = s3fs.S3FileSystem(
    key=ACCESS_KEY,
    secret=SECRET_KEY,
    client_kwargs={
        'endpoint_url': ENDPOINT_URL
    },
    default_fill_cache=False,
    use_listings_cache=False,
    skip_instance_cache=True,
    anon=False
)

for filename in os.listdir(input_folder):
    if filename.endswith(".h5"):
        h5_path = input_folder / filename
        zarr_name = filename.replace(".h5", ".zarr")
        zarr_local_path = input_folder / zarr_name
        print(f"\nConverting {h5_path} → {zarr_local_path}")
        main.convert_hdf5_to_zarr(str(h5_path), str(zarr_local_path))
        print(f"Uploading {zarr_local_path} to S3 bucket: {S3_BUCKET_NAME}")
        s3_path = f"{S3_BUCKET_NAME}/{zarr_name}"
        store = s3fs.S3Map(root=f"s3://{s3_path}", s3=s3, check=False)
        zarr.copy_store(zarr.DirectoryStore(str(zarr_local_path)), store, if_exists='replace')
        print(f"Uploaded to s3://{s3_path}")

        shutil.rmtree(zarr_local_path)
        print(f"Removed local Zarr folder: {zarr_local_path}")
