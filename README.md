# ZoomingOnline

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="./docs/assets/logo-dark.svg">
<img width="128" height="128" src="./docs/assets/logo-light.svg">
</picture>
</p>

**ZoomingOnline** is a modern web-based data visualization application for exploring massive, gigabyte-scale time-series datasets directly in your browser. Built with Svelte and optimized for efficient Zarr format data, it's specifically designed for visualizing waveform data from oscilloscopes taken in segment mode.

![Demo of ZoomingOnline in action](./docs/assets/demo.gif)

## 🌐 Try it Live

Experience ZoomingOnline with our sample datasets. Click the links below or copy the data URLs to use with your own instance:

### Sample Datasets

| Dataset | Description | Try it Now | Copy Dataset URL |
|---------|-------------|------------|------------------|
| **1nA** | Low current oscilloscope data | [🔗 View Dataset](https://datamedsci.github.io/ZoomingOnline/?data=https://s3.cloud.cyfronet.pl/zooming-online/1nA/1nA.zarr) | `https://s3.cloud.cyfronet.pl/zooming-online/1nA/1nA.zarr` |
| **64nA** | Higher current oscilloscope data | [🔗 View Dataset](https://datamedsci.github.io/ZoomingOnline/?data=https://s3.cloud.cyfronet.pl/zooming-online/64nA/64nA.zarr) | `https://s3.cloud.cyfronet.pl/zooming-online/64nA/64nA.zarr` |
| **20231204m4** | Additional experimental data | [🔗 View Dataset](https://datamedsci.github.io/ZoomingOnline/?data=https://s3.cloud.cyfronet.pl/zooming-online/20231204m4/20231204m4.zarr) | `https://s3.cloud.cyfronet.pl/zooming-online/20231204m4/20231204m4.zarr` |

### Using Your Own Data

To visualize your own Zarr datasets, simply append the data URL as a parameter:

```
https://datamedsci.github.io/ZoomingOnline/?data=YOUR_ZARR_URL_HERE
```

## ✨ Key Features

- **🚀 Instant Loading**: Pre-computed data pyramids provide immediate overview of entire datasets
- **🔍 Smart Zooming**: Fetches only required high-resolution data chunks with intelligent caching
- **⏱️ Precise Controls**: Three-level zoom interface with time-based navigation (µs, ns precision)
- **🌐 Browser-Native**: No installation required - works directly in modern web browsers
- **📊 Interactive Visualization**: D3.js-powered charts with smooth interactions
- **🔧 Developer Tools**: Complete CLI toolkit for data conversion and management

## � Perfect For

- **Researchers** analyzing oscilloscope waveform data
- **Engineers** working with time-series measurements
- **Data Scientists** exploring large temporal datasets
- **Anyone** needing fast, interactive visualization of massive time-based data

## 🚀 Quick Start

### Option 1: Use the Online Version
1. Visit [ZoomingOnline](https://datamedsci.github.io/ZoomingOnline/)
2. Enter your Zarr dataset URL or try our sample data
3. Start exploring your data immediately

### Option 2: Local Development
For developers who want to run locally or contribute:

```bash
git clone https://github.com/DataMedSci/ZoomingOnline.git
```

```bash
cd ZoomingOnline
```

See the [App Development Guide](app/) for detailed local setup instructions.

## 📁 Project Structure

```
ZoomingOnline/
├── app/              # Frontend Svelte application
├── python/           # Backend tools and data processing
├── docs/             # Documentation and guides
└── .github/          # CI/CD workflows
```

## � Documentation

- **[Setup Guide](docs/setup.md)** - Detailed installation and configuration
- **[Testing Guide](docs/testing.md)** - Running and writing tests
- **[CLI Scripts](docs/scripts.md)** - Complete tool reference
- **[App Development](app/)** - Frontend development guide
- **[Python Tools](python/)** - Backend development guide

## � Documentation

- **[Setup Guide](docs/setup.md)** - Detailed installation and configuration
- **[Testing Guide](docs/testing.md)** - Running and writing tests
- **[CLI Scripts](docs/scripts.md)** - Complete tool reference
- **[App Development](app/)** - Frontend development guide
- **[Python Tools](python/)** - Backend development guide

## 🌟 Why ZoomingOnline?

Traditional data visualization tools struggle with gigabyte-scale datasets. ZoomingOnline solves this by:

1. **Leveraging Zarr's chunked storage** for efficient partial data loading
2. **Pre-computing overview pyramids** for instant visualization
3. **Smart caching strategies** to minimize network requests
4. **Modern web architecture** for responsive, interactive experiences

##  License

MIT License - see [LICENSE](LICENSE) for details.

## 🏛️ History

Originally created as part of the Large Scale Computing course at AGH University of Science and Technology in Kraków, Poland, by @ksew1, @irosikoni, and @GosiaKk5. Recently updated with modern Svelte architecture for improved maintainability and future desktop app support.

---

**Ready to explore your data?** [Try ZoomingOnline now →](https://datamedsci.github.io/ZoomingOnline/)
