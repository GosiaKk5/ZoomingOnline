````markdown
<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="./docs/assets/logo-dark.svg">
<img width="128" height="128" src="./docs/assets/logo-light.svg">
</picture>
</p>

<h1 align="center">ZoomingOnline</h1>


ZoomingOnline is a modern web-based data visualization application built with Svelte, supporting the efficient and scalable Zarr format.
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

- **Modern Architecture:** Built with Svelte for reactive state management and component-based architecture
- **Efficient Zooming:** Fetches only the required high-resolution data chunks for the selected region, with a
  memory-efficient cache to prevent redundant downloads during interaction.
- **Time-Based Controls:** Features a three-level inset zoom interface with draggable windows and sliders that snap to
  meaningful time units (e.g., 10 µs, 100 ns) for precise analysis.
- **Instant Overview:** Utilizes pre-computed data pyramids within the Zarr format to load an initial overview of the
  entire dataset almost instantly.
- **Desktop Ready:** Architecture prepared for future desktop app deployment using Tauri or Electron.
- **Data Toolkit:** Includes a suite of CLI scripts for generating test data, converting from HDF5, and managing cloud
  storage.

## 🏗️ Architecture

The application is built using modern web technologies:

- **Frontend Framework:** Svelte with Vite bundler
- **State Management:** Svelte stores for reactive state management
- **Visualization:** D3.js for interactive charts and data visualization
- **Data Processing:** Zarr.js for efficient array data handling
- **Deployment:** GitHub Pages with automated CI/CD

### Project Structure

```
app/                    # Svelte application
├── src/
│   ├── components/     # Svelte components
│   │   ├── Header.svelte
│   │   ├── DataLoader.svelte
│   │   ├── Charts.svelte
│   │   ├── Controls.svelte
│   │   └── CopyLink.svelte
│   ├── stores/         # Svelte stores
│   │   └── appStore.js
│   ├── utils/          # Utility modules
│   │   ├── dataLoader.js
│   │   ├── chartRenderer.js
│   │   ├── timeUtils.js
│   │   └── uiManager.js
│   ├── App.svelte      # Root component
│   └── main.js         # Application entry point
├── package.json
├── vite.config.js
└── svelte.config.js

src/                    # Python CLI tools
├── generate_data.py
├── convert_hdf5_to_zarr.py
├── data_to_s3_importer.py
└── cors_server.py
```

## 🛠 Available CLI Scripts

| Script                    | Description                                      |
|---------------------------|--------------------------------------------------|
| `generate_data.py`        | Generate .zarr or .h5 oscilloscope-like datasets |
| `convert_hdf5_to_zarr.py` | Convert HDF5 files to Zarr format                |
| `data_to_s3_importer.py`  | Recursively convert + upload to S3 bucket        |
| `cors_server.py`          | Serve .zarr files locally with CORS enabled HTTP |

📖 See [scripts.md](./docs/scripts.md) for detailed CLI usage and arguments.

## 🚀 Development Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ (for CLI tools)

### Frontend Development

1. Clone the repository
2. Install dependencies:
   ```bash
   cd app
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Open browser at http://localhost:5173

### Building for Production

```bash
cd app
npm run build
```

The built application will be in the `app/dist/` directory.

### Backend Development (Python Tools)

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt  # if available
   # or install individual packages as needed
   ```

2. Create or serve a Zarr dataset:
   ```bash
   python src/generate_data.py -o waveform.zarr
   python src/cors_server.py
   ```

3. Access your local data at:
   ```
   http://localhost:5173/?data=http://localhost:8000/waveform.zarr
   ```

## 🖥️ Desktop App Preparation

The application architecture is prepared for desktop deployment:

- **Tauri Integration:** Ready for Rust-based desktop wrapper
- **Electron Support:** Can be packaged as Electron app
- **Component Architecture:** Modular design enables easy platform-specific customizations

## 🌐 Deployment

The application is automatically deployed to GitHub Pages when changes are pushed to the main branch.

### Manual Deployment

To deploy manually:

```bash
cd app
npm run build
# Deploy contents of dist/ directory to your web server
```

## Zarr Version Support
This project currently supports Zarr v2.

To add support for Zarr v3, migration to [zarrita.js](https://github.com/manzt/zarrita.js) is required.

## 🧪 Testing

The project includes automated browser tests to verify application functionality.

📖 See [testing.md](./docs/testing.md) for detailed information about testing tools and procedures.

## 📄 License

MIT License — see [LICENSE](LICENSE)

## History

The project was originally created as a part of the Large Scale Computing course at the AGH University in Kraków, Poland, by @ksew1, @irosikoni and @GosiaKk5.

Updated to modern Svelte architecture for improved maintainability and future desktop app support.

````
