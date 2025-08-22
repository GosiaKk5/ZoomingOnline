# Python Backend - Developer Guide

This directory contains the Python backend tools and utilities for ZoomingOnline. These tools handle data processing, format conversion, and local development server functionality.

## 🏗️ Architecture

The Python backend is organized as a standalone package with the following structure:

```
python/
├── src/                    # Core Python modules
├── tests/                  # Test suite
├── examples/              # Example scripts and configurations
├── pyproject.toml         # Project configuration and dependencies
├── uv.lock               # Dependency lock file
├── .python-version       # Python version specification
├── check.sh              # Code quality checks
└── fix.sh                # Automatic code fixes
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+ (specified in `.python-version`)
- [uv](https://docs.astral.sh/uv/) package manager

### Setup Development Environment

```bash
cd python
```

```bash
uv sync
```

```bash
./check.sh
```

Or run individually:

```bash
uv run ruff format --check .
```

```bash
uv run ruff check .
```

```bash
uv run pytest
```

## 📦 Core Modules (`src/`)

### Data Conversion Tools

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| `convert_hdf5_to_zarr.py` | HDF5 → Zarr conversion | `convert_hdf5_to_zarr()` |
| `generate_data.py` | Synthetic data generation | `generate_realistic_data()`, `save_zarr()` |
| `data_to_s3_importer.py` | Cloud storage management | `upload_to_s3()`, `batch_convert()` |

### Development Utilities

| Module | Purpose | Usage |
|--------|---------|-------|
| `cors_server.py` | Local development server | Serves Zarr files with CORS headers |

### Usage Examples

```bash
uv run python src/generate_data.py -o test_data.zarr --minimal
```

```bash
uv run python src/convert_hdf5_to_zarr.py input.h5 output.zarr
```

```bash
uv run python src/cors_server.py --port 8000
```

## 🧪 Testing

The test suite uses `pytest` and is located in the `tests/` directory:

```bash
uv run pytest
```

```bash
uv run pytest tests/test_generate_data.py
```

```bash
uv run pytest --cov=src
```

### Test Structure

- `test_convert_hdf5_to_zarr.py` - Tests for HDF5 conversion
- `test_generate_data.py` - Tests for data generation
- `test_data_tos3_importer.py` - Tests for S3 operations

## 🔧 Development Tools

### Code Quality

```bash
./check.sh
```

```bash
./fix.sh
```

Manual operations:

```bash
uv run ruff format .
```

```bash
uv run ruff check --fix .
```

### Configuration

- **`pyproject.toml`**: Central configuration for dependencies, tool settings, and project metadata
- **`uv.lock`**: Locked dependency versions for reproducible builds
- **`.python-version`**: Python version specification for pyenv/uv

## 📁 Key Directories

### `examples/`
Contains example scripts and configurations:
- `run_importer.slurm` - Slurm job script for cluster environments

### `tests/`
Complete test suite with pytest configuration:
- Unit tests for all core modules
- Integration tests for data workflows
- Mock configurations for S3 operations

## 🔗 Integration with Frontend

The Python backend integrates with the Svelte frontend through:

1. **Data Generation**: Creates Zarr datasets compatible with the frontend
2. **Development Server**: `cors_server.py` serves local data during development
3. **Format Conversion**: Prepares data in the optimal Zarr format for visualization

### Development Workflow

Terminal 1: Start Python development server
```bash
cd python
```

```bash
uv run python src/cors_server.py --port 8000
```

Terminal 2: Start frontend development server
```bash
cd app
```

```bash
npm run dev
```

Access app at http://localhost:5173  
Load local data: http://localhost:5173/?data=http://localhost:8000/your_data.zarr

## 📊 Data Format Specifications

### Zarr Structure

The tools generate/expect Zarr arrays with this structure:

```
dataset.zarr/
├── .zgroup                 # Zarr group metadata
├── raw/                    # Raw data arrays
│   └── 0.0.0.0            # Chunked data files
└── overview/               # Pre-computed overviews
    └── 0/                 # Overview level 0
        └── 0.0.0.0        # Overview chunks
```

### Data Dimensions

- **Shape**: `(channels, trc_files, segments, samples)`
- **Chunk Size**: Optimized for web access patterns
- **Compression**: Blosc compression for efficient storage
- **Overviews**: Pre-computed min/max pyramids for fast visualization

## 🚀 Performance Considerations

### Memory Management
- Chunked processing for large datasets
- Lazy loading with zarr arrays
- Efficient memory mapping for HDF5 inputs

### Network Optimization
- Optimal chunk sizes for web delivery
- Pre-computed overview pyramids
- Compression algorithms optimized for time-series data

## 🐛 Debugging

### Common Issues

1. **Import Errors**: Ensure `uv sync` has been run
2. **Path Issues**: Python path is configured in `pyproject.toml`
3. **Dependency Conflicts**: Check `uv.lock` for version locks

### Logging

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🔄 Continuous Integration

The Python backend is tested in GitHub Actions:

- **Code Quality**: Ruff formatting and linting
- **Testing**: Full pytest suite
- **Python Versions**: Currently supports Python 3.11+

See `.github/workflows/python-tests.yml` for the complete CI configuration.

## 🤝 Contributing

### Adding New Features

1. Create module in `src/`
2. Add corresponding tests in `tests/`
3. Update dependencies in `pyproject.toml`
4. Run `./check.sh` to verify code quality
5. Update this README if needed

### Code Style

- Follow PEP 8 (enforced by ruff)
- Use type hints for all functions
- Add docstrings for public APIs
- Maintain test coverage above 80%

---

For user-focused documentation, see the [main README](../README.md).
