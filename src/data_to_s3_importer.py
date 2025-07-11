#!/usr/bin/env python3

import argparse
import os
import shutil
import subprocess
import time
from pathlib import Path

from dotenv import load_dotenv

from src.convert_hdf5_to_zarr import convert_hdf5_to_zarr


def load_s3_env() -> dict[str, str]:
    load_dotenv()
    return {
        "access_key": os.getenv("AWS_ACCESS_KEY_ID"),
        "secret_key": os.getenv("AWS_SECRET_ACCESS_KEY"),
        "endpoint_url": os.getenv("S3_ENDPOINT_URL"),
        "bucket_name": os.getenv("S3_BUCKET_NAME", "zooming-online"),
    }


def convert_and_get_zarr_path(hdf_path: Path, output_dir: Path) -> Path:
    zarr_path = output_dir / hdf_path.with_suffix(".zarr").name
    print(f"\n🔄 Converting {hdf_path} → {zarr_path}")
    convert_hdf5_to_zarr(hdf_path, zarr_path)
    print(f"✅ Conversion complete: {zarr_path}")
    return zarr_path


def upload_zarr_with_mc(
    local_path: Path,
    bucket: str,
    remote_key: str,
    *,
    mc_alias: str = "cyf-public",
    keep_local: bool = False,
) -> None:
    mc_bin = str(Path.home() / "minio-mc")
    mc_cmd = [
        mc_bin,
        "cp",
        "--recursive",
        str(local_path),
        f"{mc_alias}/{bucket}/{remote_key}/",
    ]

    print(f"☁️ Uploading {local_path} → s3://{bucket}/{remote_key} via `{mc_bin}`")
    time.sleep(1)

    try:
        result = subprocess.run(mc_cmd, check=True, text=True, capture_output=True)  # noqa: S603
        print(result.stdout)
        if result.stderr:
            print(f"⚠️ stderr: {result.stderr}")
        print("✅ mc upload finished")

        if not keep_local:
            print(f"🧹 Removing local Zarr: {local_path}")
            shutil.rmtree(local_path)

    except subprocess.CalledProcessError as err:
        print("❌ mc upload failed!")
        print(f"Command: {' '.join(mc_cmd)}")
        print(f"Return code: {err.returncode}")
        print(f"stdout:\n{err.stdout}")
        print(f"stderr:\n{err.stderr}")
        raise


def main() -> None:
    env = load_s3_env()

    parser = argparse.ArgumentParser(description="Convert .hdf to .zarr and upload to S3 (via mc).")
    parser.add_argument("-i", "--input", required=True, help="Path to .hdf file")
    parser.add_argument("-o", "--output-dir", required=True, help="Local dir for .zarr")
    parser.add_argument("--bucket", help="S3 bucket (overrides .env)")
    parser.add_argument("--skip-upload", action="store_true", help="Only convert, skip mc upload")
    parser.add_argument("--keep-local", action="store_true", help="Keep local .zarr after upload")
    parser.add_argument("--mc-alias", default="cyf-public", help="MinIO alias (default: cyf-public)")

    args = parser.parse_args()

    hdf_path = Path(args.input).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    bucket_name = args.bucket or env["bucket_name"]

    if not hdf_path.exists():
        error_message = f"❌ Input file not found: {hdf_path}"
        raise FileNotFoundError(error_message)
    if not hdf_path.is_file():
        error_message = f"❌ Input path is a directory, not a file: {hdf_path}"
        raise IsADirectoryError(error_message)
    if hdf_path.suffix.lower() != ".hdf":  # Using .lower() for case-insensitivity
        error_message = f"❌ Input file is not a .hdf file: {hdf_path} (expected .hdf)"
        raise ValueError(error_message)

    output_dir.mkdir(parents=True, exist_ok=True)
    zarr_path = convert_and_get_zarr_path(hdf_path, output_dir)

    if args.skip_upload:
        print("⏭️ Upload skipped (--skip-upload).")
    else:
        remote_key = zarr_path.stem
        upload_zarr_with_mc(
            local_path=zarr_path,
            bucket=bucket_name,
            remote_key=remote_key,
            mc_alias=args.mc_alias,
            keep_local=args.keep_local,
        )


if __name__ == "__main__":
    main()
