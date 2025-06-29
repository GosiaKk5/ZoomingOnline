import http.server
import socketserver
import zarr
import numpy as np
import numcodecs
import shutil
from pathlib import Path

PORT = 8000
CREATE_ZARR_STORE = False

def create_zarr_store(path="dummy_scope_data.zarr"):
    path = Path(path)
    if path.is_dir():
        print(f"Removing existing Zarr store: {path}")
        shutil.rmtree(path)

    print(f"Creating dummy Zarr store: {path}")

    no_of_samples = 500000
    horiz_interval = 2e-9
    num_channels = 3
    num_trc_files = 1
    num_segments = 1
    gain = 1e-4
    offset = -0.2

    time_s = np.arange(no_of_samples) * horiz_interval
    voltage_v = np.random.normal(0, 0.01, size=no_of_samples)
    voltage_v += 0.1 * np.sin(2 * np.pi * 5e3 * time_s)

    feature_start_idx = int(443.5e-6 / horiz_interval)
    feature_end_idx = int(443.75e-6 / horiz_interval)
    feature_len = feature_end_idx - feature_start_idx
    feature_time = np.linspace(0, 20, feature_len)
    feature_signal = -0.05 * np.exp(-feature_time) * np.sin(2 * np.pi * 50 * feature_time)
    voltage_v[feature_start_idx:feature_end_idx] += feature_signal

    samples_adc = np.zeros((num_channels, num_trc_files, num_segments, no_of_samples), dtype='int16')
    for ch in range(num_channels):
        ch_offset = ch * 0.05
        adc = (voltage_v + ch_offset + offset) / gain
        samples_adc[ch, 0, 0, :] = adc.astype('int16')

    compressor = numcodecs.Blosc(cname='zstd', clevel=3, shuffle=2)
    store = zarr.open(
        str(path),
        mode='w',
        shape=samples_adc.shape,
        chunks=(1, 1, 1, 100000),
        compressor=compressor,
        dtype='int16'
    )

    store[:] = samples_adc

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
    if CREATE_ZARR_STORE:
        create_zarr_store()
    print(f"Serving at http://localhost:{PORT} with CORS enabled")
    httpd.serve_forever()