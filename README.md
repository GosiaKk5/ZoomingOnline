# ZoomingOnline

ZoomingOnline is a web-based data visualization supporting the efficient and scalable Zarr format.

🌐 Try it live: [https://gosiakk5.github.io/ZoomingOnline/](https://gosiakk5.github.io/ZoomingOnline/)

## 🛠 Available CLI Scripts

| Script                    | Description                                      |
|---------------------------|--------------------------------------------------|
| `generate_data.py`        | Generate .zarr or .h5 oscilloscope-like datasets |
| `convert_hdf5_to_zarr.py` | Convert HDF5 files to Zarr format                |
| `data_to_s3_importer.py`  | Recursively convert + upload to S3 bucket        |
| `cors_server.py`          | Serve .zarr files locally with CORS enabled HTTP |

📖 See [scripts.md](./docs/scripts.md) for detailed CLI usage and arguments.

---

## 🚀 Quick Start

1. Clone the repository
2. Follow [setup.md](./docs/setup.md) to install dependencies and configure
3. Create or serve a Zarr dataset:
   ```bash
   python src/generate_data.py -o waveform.zarr
   python src/cors_server.py
   ```
4. View in browser: http://localhost:8000/website, website/index.html or on online
   at [https://gosiakk5.github.io/ZoomingOnline/](https://gosiakk5.github.io/ZoomingOnline/)
5. In the input field enter http://localhost:8000/waveform.zarr or any other Zarr URL

## 📄 License

MIT License — see [LICENSE](LICENSE)