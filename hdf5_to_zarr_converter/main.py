import h5py
import zarr
import argparse

def convert_hdf5_to_zarr(hdf5_file_path, zarr_file_path):
    with h5py.File(hdf5_file_path, 'r') as hdf5_file:
        zarr_group = zarr.open_group(zarr_file_path, mode='w')
        zarr.copy(hdf5_file, zarr_group, name="samples", if_exists='replace')
    print(f"Conversion complete! Zarr file created at: {zarr_file_path}")