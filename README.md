<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="./docs/assets/logo-dark.svg">
<img width="128" height="128" src="./docs/assets/logo-light.svg">
</picture>
</p>

<h1 align="center">ZoomingOnline</h1>


ZoomingOnline is a web-based data visualization supporting the efficient and scalable Zarr format.
Main use case is visualization of the waveform data from oscilloscopes, taken in segment mode.

![demo](./docs/assets/demo.gif)

## 🌐 Try it live

Click on the links below to view the sample datasets, or copy the data file URLs to use in your own instance:

### Sample Dataset 1 (1nA)
[View 1nA dataset in ZoomingOnline](https://datamedsci.github.io/ZoomingOnline/?data=https://s3.cloud.cyfronet.pl/zooming-online/1nA/1nA.zarr)

Data file URL (copy to use with your own instance):
```
https://s3.cloud.cyfronet.pl/zooming-online/1nA/1nA.zarr
```

### Sample Dataset 2 (64nA)
[View 64nA dataset in ZoomingOnline](https://datamedsci.github.io/ZoomingOnline/?data=https://s3.cloud.cyfronet.pl/zooming-online/64nA/64nA.zarr)

Data file URL (copy to use with your own instance):
```
https://s3.cloud.cyfronet.pl/zooming-online/64nA/64nA.zarr
```

### Additional Data Files
Additional file available on S3 (copy to use with [ZoomingOnline](https://datamedsci.github.io/ZoomingOnline/)):
```
https://s3.cloud.cyfronet.pl/zooming-online/20231204m4/20231204m4.zarr
```

## 🎯 Aim of the Project

The aim of **ZoomingOnline** is to provide a high-performance web viewer for interactively exploring massive,
gigabyte-scale time-series datasets directly in a browser.

Key features include:

- **Efficient Zooming:** Fetches only the required high-resolution data chunks for the selected region, with a
  memory-efficient cache to prevent redundant downloads during interaction.
- **Time-Based Controls:** Features a three-level inset zoom interface with draggable windows and sliders that snap to
  meaningful time units (e.g., 10 µs, 100 ns) for precise analysis.
- **Instant Overview:** Utilizes pre-computed data pyramids within the Zarr format to load an initial overview of the
  entire dataset almost instantly.
- **Data Toolkit:** Includes a suite of CLI scripts for generating test data, converting from HDF5, and managing cloud
  storage.

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
   ```
   ```bash
   python src/cors_server.py
   ```
4. View in browser: http://localhost:8000/website, website/index.html or online at [ZoomingOnline](https://datamedsci.github.io/ZoomingOnline/)
5. In the input field enter http://localhost:8000/waveform.zarr or any other Zarr URL, you can also set path to
   the Zarr file in query parameters, for example:
   ```
   https://datamedsci.github.io/ZoomingOnline/?data=http://localhost:8000/waveform.zarr
   ```

## Zarr Version Support
This project currently supports Zarr v2.

To add support for Zarr v3, migration to [zarrita.js](https://github.com/manzt/zarrita.js) is required.

## 🧪 Testing

The project includes automated browser tests using Playwright. These tests verify that the web application loads correctly, can access data files, and properly renders visualizations.

To run the tests locally:

1. Install Node.js dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

3. Run the tests:
   ```bash
   npm test
   ```

Alternatively, use the provided script:
```bash
./run_browser_tests.sh
```

These tests are also run automatically via GitHub Actions on every push, pull request, and weekly.

📖 See [browser-tests.md](./docs/browser-tests.md) for detailed information about the browser tests.

## 📄 License

MIT License — see [LICENSE](LICENSE)

## History

The project was originally created as a part of the Large Scale Computing course at the AGH University in Kraków, Poland, by @ksew1, @irosikoni and @GosiaKk5.
