import os
import subprocess
import argparse
from pathlib import Path
from dotenv import load_dotenv

from src.convert_hdf5_to_zarr import convert_hdf5_to_zarr

def load_s3_env() -> dict[str, str]:
    load_dotenv()
    return {
        "access_key": os.getenv("AWS_ACCESS_KEY_ID"),
        "secret_key": os.getenv("AWS_SECRET_ACCESS_KEY"),
        "endpoint_url": os.getenv("S3_ENDPOINT_URL"),
        "bucket_name": os.getenv("S3_BUCKET_NAME", "zarr-test-iza"),
    }

def convert_and_get_zarr_path(hdf_path: Path, output_dir: Path) -> Path:
    zarr_name = hdf_path.with_suffix(".zarr").name
    zarr_path = output_dir / zarr_name
    print(f"\n🔄 Converting {hdf_path} → {zarr_path}")
    convert_hdf5_to_zarr(hdf_path, zarr_path)
    print(f"✅ Conversion complete: {zarr_path}")
    return zarr_path

def upload_zarr_with_mc(local_path: Path, bucket: str, remote_key: str, env: dict) -> None:
    # Assuming 'mc' is installed and configured to use your S3 endpoint/credentials.
    # If 'cyf-s3p' is your mc alias, you'd use that.
    # If not, you might need to dynamically configure mc via environment vars or config file.
    # This is the simplest form assuming mc is already set up.
    mc_command = [
        "mc", "cp", "--recursive",
        str(local_path),
        f"cyf-s3p/{bucket}/{remote_key}/"
    ]
    print(f"🚀 Executing: {' '.join(mc_command)}")
    try:
        result = subprocess.run(mc_command, check=True, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print(f"⚠️  stderr: {result.stderr}")
        print(f"✅ Uploaded using mc: {local_path} to s3://{bucket}/{remote_key}")
    except subprocess.CalledProcessError as e:
        print(f"❌ mc command failed with error: {e}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
        raise

def main() -> None:
    env = load_s3_env()

    parser = argparse.ArgumentParser(description="Convert .hdf to Zarr and upload to S3 via mc.")
    parser.add_argument("--input", "-i", required=True, help="Path to input .hdf file")
    parser.add_argument("--output-dir", "-o", required=True, help="Local output dir for Zarr")
    parser.add_argument("--bucket", help="S3 bucket name (overrides .env)")
    parser.add_argument("--skip-upload", action="store_true", help="Skip upload step")
    args = parser.parse_args()

    hdf_path = Path(args.input).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    bucket_name = args.bucket or env["bucket_name"]

    if not hdf_path.exists() or hdf_path.suffix != ".hdf":
        raise FileNotFoundError(f"❌ Input file not found or not a .hdf file: {hdf_path}")

    output_dir.mkdir(parents=True, exist_ok=True)

    zarr_path = convert_and_get_zarr_path(hdf_path, output_dir)

    if not args.skip_upload:
        upload_zarr_with_mc(zarr_path, bucket_name, zarr_path.name, env)
    else:
        print("⏭️ Upload skipped.")

if __name__ == "__main__":
    main()
