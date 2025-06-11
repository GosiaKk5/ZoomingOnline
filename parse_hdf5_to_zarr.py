import h5py
import argparse

def convert_hdf5_to_zarr(hdf5_file_path, zarr_file_path):
    with h5py.File(hdf5_file_path, 'r') as hdf5_file:
        # Convert to Zarr format
        hdf5_file.to_zarr(zarr_file_path, overwrite=True)
    print(f"Conversion complete! Zarr file created at: {zarr_file_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert HDF5 file to Zarr format.")
    parser.add_argument("hdf5_file", type=str, help="Path to the input HDF5 file.")
    parser.add_argument("zarr_file", type=str, help="Path to the output Zarr file.")
    
    args = parser.parse_args()
    
    convert_hdf5_to_zarr(args.hdf5_file, args.zarr_file)