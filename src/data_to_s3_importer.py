import argparse
import os
import shutil
import subprocess
from pathlib import Path

from dotenv import load_dotenv

from src.convert_hdf5_to_zarr import convert_hdf5_to_zarr


# ---------------------------------------------------------------------- #
#  Helpers
# ---------------------------------------------------------------------- #
def load_s3_env() -> dict[str, str]:
    """Wczytaj zmienne z .env (lub środowiska)."""
    load_dotenv()
    return {
        "access_key": os.getenv("AWS_ACCESS_KEY_ID"),
        "secret_key": os.getenv("AWS_SECRET_ACCESS_KEY"),
        "endpoint_url": os.getenv("S3_ENDPOINT_URL"),  # nieużywane przez mc, ale zostawiamy
        "bucket_name": os.getenv("S3_BUCKET_NAME", "zarr-test-iza"),
    }


def convert_and_get_zarr_path(hdf_path: Path, output_dir: Path) -> Path:
    """Konwertuj .hdf do .zarr, zwróć ścieżkę do folderu .zarr."""
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
    mc_alias: str = "cyf-s3p",
    keep_local: bool = False,
) -> None:
    """Wyślij folder Zarr na S3 przez MinIO Client (`mc`)."""
    mc_cmd = [
        "mc",
        "cp",
        "--recursive",
        str(local_path),
        f"{mc_alias}/{bucket}/{remote_key}/",  # trailing slash = folder
    ]
    print(f"☁️  Uploading {local_path} → s3://{bucket}/{remote_key} via mc")
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
        print(f"stdout: {err.stdout}")
        print(f"stderr: {err.stderr}")
        raise


# ---------------------------------------------------------------------- #
#  Main
# ---------------------------------------------------------------------- #
def main() -> None:
    env = load_s3_env()

    parser = argparse.ArgumentParser(description="Convert .hdf to .zarr and upload to S3 (via mc).")
    parser.add_argument("-i", "--input", required=True, help="Path to .hdf file")
    parser.add_argument("-o", "--output-dir", required=True, help="Local dir for .zarr")
    parser.add_argument("--bucket", help="S3 bucket (overrides .env)")
    parser.add_argument("--skip-upload", action="store_true", help="Only convert, skip mc upload")
    parser.add_argument(
        "--keep-local",
        action="store_true",
        help="Keep local .zarr after successful upload",
    )
    parser.add_argument(
        "--mc-alias",
        default="cyf-s3p",
        help="MinIO Client alias pointing at your S3 endpoint (default: cyf-s3p)",
    )

    args = parser.parse_args()

    hdf_path = Path(args.input).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    bucket_name = args.bucket or env["bucket_name"]

    if not hdf_path.exists() or hdf_path.suffix != ".hdf":
        message = f"❌ Input file not found or not a .hdf file: {hdf_path}"
        raise FileNotFoundError(message)

    output_dir.mkdir(parents=True, exist_ok=True)

    zarr_path = convert_and_get_zarr_path(hdf_path, output_dir)

    if args.skip_upload:
        print("⏭️ Upload skipped (flag --skip-upload).")
    else:
        upload_zarr_with_mc(
            zarr_path,
            bucket_name,
            zarr_path.name,
            mc_alias=args.mc_alias,
            keep_local=args.keep_local,
        )


if __name__ == "__main__":
    main()
