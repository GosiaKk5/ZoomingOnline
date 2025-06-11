import h5py
import numpy as np

filename = "test_data.h5"

with h5py.File(filename, "w") as f:
    group = f.create_group("samples")
    
    n = 1000
    timestamps = np.arange(n)
    values = np.random.normal(loc=0.0, scale=1.0, size=n)

    group.create_dataset("timestamp", data=timestamps)
    group.create_dataset("value", data=values)

print(f"Generated: {filename}")
