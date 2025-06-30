<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="./docs/assets/logo-dark.svg">
<img width="128" height="128" src="./docs/assets/logo-light.svg">
</picture>
</p>

<h1 align="center">ZoomingOnline</h1>


ZoomingOnline is a web-based data visualization supporting the efficient and scalable Zarr format.

![demo](./docs/assets/demo.gif)

🌐 Try it live: [https://gosiakk5.github.io/ZoomingOnline/](https://gosiakk5.github.io/ZoomingOnline/)

## 🎯 Aim of the Project

The aim of **ZoomingOnline** is to serve as a web-based viewer for interactively exploring large time-series datasets,
such as those from oscilloscopes. It is designed to render data directly from a Zarr store over HTTP without a
specialized backend.

The project includes:

- **Core Technology:** The application utilizes the chunked **Zarr** data format and performs on-demand progressive
  downsampling in the browser. This approach fetches only the data required for the current field of view.
- **Visualization Interface:** The display consists of a three-level inset zoom. Each zoom level's position and
  magnification (up to 1000x) can be adjusted with draggable windows and sliders.
- **Supporting Scripts:** A set of CLI scripts is provided for generating test data, converting from HDF5, and managing
  uploads to cloud storage.

## 🛠 Available CLI Scripts

| Script                    | Description                                      |
|---------------------------|--------------------------------------------------|
| `generate_data.py`        | Generate .zarr or .h5 oscilloscope-like datasets |
| `convert_hdf5_to_zarr.py` | Convert HDF5 files to Zarr format                |
| `data_to_s3_importer.py`  | Recursively convert + upload to S3 bucket        |
| `cors_server.py`          | Serve .zarr files locally with CORS enabled HTTP |

📖 See [scripts.md](./docs/scripts.md) for detailed CLI usage and arguments.

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