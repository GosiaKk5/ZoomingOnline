import argparse
import os
import shutil
from pathlib import Path

import boto3
import s3fs
import zarr
from dotenv import load_dotenv
from s3fs import S3FileSystem

from src.convert_hdf5_to_zarr import convert_hdf5_to_zarr


def load_s3_env() -> dict[str, str]:
    load_dotenv()
    return {
        "access_key": os.getenv("AWS_ACCESS_KEY_ID"),
        "secret_key": os.getenv("AWS_SECRET_ACCESS_KEY"),
        "endpoint_url": os.getenv("S3_ENDPOINT_URL"),
        "bucket_name": os.getenv("S3_BUCKET_NAME", "zarr-test-iza"),
    }


def process_file(
    h5_path: Path, output_dir: Path, s3: S3FileSystem | None, bucket_name: str, *, skip_upload: bool
) -> None:
    zarr_name = h5_path.with_suffix(".zarr").name
    zarr_local_path = output_dir / zarr_name

    print(f"\nConverting {h5_path} → {zarr_local_path}")
    convert_hdf5_to_zarr(h5_path, zarr_local_path)

    if not skip_upload:
        print(f"Uploading {zarr_local_path} to S3 bucket: {bucket_name}")
        s3_path = f"{bucket_name}/{zarr_name}"
        store = s3fs.S3Map(root=f"s3://{s3_path}", s3=s3, check=False)
        zarr.copy_store(zarr.DirectoryStore(str(zarr_local_path)), store, if_exists="replace")
        print(f"Uploaded to s3://{s3_path}")

    shutil.rmtree(zarr_local_path)
    print(f"Removed local Zarr folder: {zarr_local_path}")


def main() -> None:
    env = load_s3_env()

    parser = argparse.ArgumentParser(description="Convert .h5 files to Zarr and upload to S3.")
    parser.add_argument("input_folder", help="Folder with .h5 files")
    parser.add_argument("--bucket", help="S3 bucket name (overrides S3_BUCKET_NAME in .env)")
    parser.add_argument("--skip-upload", action="store_true", help="Skip uploading to S3")
    args = parser.parse_args()

    input_folder = Path(args.input_folder)
    bucket_name = args.bucket or env["bucket_name"]

    if not input_folder.exists() or not input_folder.is_dir():
        message = f"Folder not found: {input_folder}"
        raise FileNotFoundError(message)

    s3 = None
    if not args.skip_upload:
        _session = boto3.session.Session()
        s3 = S3FileSystem(
            key=env["access_key"],
            secret=env["secret_key"],
            client_kwargs={"endpoint_url": env["endpoint_url"]},
            default_fill_cache=False,
            use_listings_cache=False,
            skip_instance_cache=True,
            anon=False,
        )

    for file in input_folder.iterdir():
        if file.suffix == ".h5":
            process_file(file, input_folder, s3, bucket_name, skip_upload=args.skip_upload)


if __name__ == "__main__":
    main()
