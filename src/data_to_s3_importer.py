"""Convert a single .hdf file to .zarr and upload to S3 using boto3/s3fs, not `mc`.

After successful upload, the local .zarr directory is removed by default.
Use --keep-local to preserve the local output.
"""

import argparse
import os
import shutil
from pathlib import Path

import s3fs
import zarr
from dotenv import load_dotenv

from src.convert_hdf5_to_zarr import convert_hdf5_to_zarr


def load_s3_env() -> dict[str, str]:
    """Load environment variables from .env (or use system-environment)."""
    load_dotenv()
    return {
        "access_key": os.getenv("AWS_ACCESS_KEY_ID"),
        "secret_key": os.getenv("AWS_SECRET_ACCESS_KEY"),
        "endpoint_url": os.getenv("S3_ENDPOINT_URL"),
        "bucket_name": os.getenv("S3_BUCKET_NAME", "zarr-test-iza"),
    }


def convert_and_get_zarr_path(hdf_path: Path, output_dir: Path) -> Path:
    """Convert .hdf to .zarr, return .zarr directory path."""
    zarr_path = output_dir / hdf_path.with_suffix(".zarr").name
    print(f"\n🔄 Converting {hdf_path} → {zarr_path}")
    convert_hdf5_to_zarr(hdf_path, zarr_path)
    print(f"✅ Conversion complete: {zarr_path}")
    return zarr_path


def upload_zarr_to_s3(  # noqa: PLR0913
    local_path: Path,
    bucket: str,
    remote_key: str,
    *,
    endpoint_url: str,
    access_key: str,
    secret_key: str,
    keep_local: bool = False,
) -> None:
    """Upload local Zarr directory to S3 using s3fs."""
    print(f"☁️  Uploading {local_path} → s3://{bucket}/{remote_key}")

    fs = s3fs.S3FileSystem(
        key=access_key,
        secret=secret_key,
        client_kwargs={"endpoint_url": endpoint_url},
        default_fill_cache=False,
        use_listings_cache=False,
        skip_instance_cache=True,
        anon=False,
    )

    s3_store = s3fs.S3Map(root=f"{bucket}/{remote_key}", s3=fs, check=False)
    local_store = zarr.DirectoryStore(str(local_path))

    try:
        zarr.copy_store(src=local_store, dest=s3_store, if_exists="replace")
        print(f"✅ Upload finished: s3://{bucket}/{remote_key}")
        if not keep_local:
            print(f"🧹 Removing local Zarr: {local_path}")
            shutil.rmtree(local_path)
    except Exception as err:
        print(f"❌ Upload failed: {err}")
        raise


def main() -> None:
    env = load_s3_env()

    parser = argparse.ArgumentParser(description="Convert .hdf to .zarr and upload to S3.")
    parser.add_argument("-i", "--input", required=True, help="Path to .hdf file")
    parser.add_argument("-o", "--output-dir", required=True, help="Directory to write .zarr locally")
    parser.add_argument("--bucket", help="S3 bucket (overrides .env)")
    parser.add_argument("--skip-upload", action="store_true", help="Only convert, skip S3 upload")
    parser.add_argument("--keep-local", action="store_true", help="Keep local .zarr folder after upload")

    args = parser.parse_args()

    hdf_path = Path(args.input).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    bucket_name = args.bucket or env["bucket_name"]

    if not hdf_path.exists() or hdf_path.suffix != ".hdf":
        message = f"❌ Input file not found or is not a .hdf file: {hdf_path}"
        raise FileNotFoundError(message)

    output_dir.mkdir(parents=True, exist_ok=True)
    zarr_path = convert_and_get_zarr_path(hdf_path, output_dir)

    if args.skip_upload:
        print("⏭️ Upload skipped (--skip-upload).")
    else:
        upload_zarr_to_s3(
            local_path=zarr_path,
            bucket=bucket_name,
            remote_key=zarr_path.name,
            endpoint_url=env["endpoint_url"],
            access_key=env["access_key"],
            secret_key=env["secret_key"],
            keep_local=args.keep_local,
        )


if __name__ == "__main__":
    main()
