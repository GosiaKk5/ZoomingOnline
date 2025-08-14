# Svelte Frontend - Developer Guide

This directory contains the Svelte frontend application for ZoomingOnline. The application provides an interactive web interface for visualizing and exploring large time-series datasets stored in Zarr format.

## 🏗️ Architecture

The frontend is built with modern web technologies and organized as follows:

```
app/
├── src/                   # Source code
├── static/               # Static assets
├── tests/                # E2E tests with Playwright
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite build configuration
├── playwright.config.js  # Playwright test configuration
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 24+ (specified in GitHub Actions)
- npm (comes with Node.js)

### Setup Development Environment

```bash
# Navigate to app directory
cd app

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

## 📦 Available Scripts

| Command | Purpose | Usage |
|---------|---------|-------|
| `npm run dev` | Start development server | Local development with hot reload |
| `npm run build` | Production build | Generates optimized build in `dist/` |
| `npm run preview` | Preview production build | Test production build locally |
| `npm test` | Run E2E tests | Playwright browser tests |

## 🔧 Development Tools

### Build System

- **Vite**: Fast build tool and dev server
- **ES Modules**: Native ES module support
- **Hot Module Replacement**: Instant updates during development

### Testing

- **Playwright**: E2E browser testing
- **Multi-browser**: Tests on Chromium, Firefox, and WebKit
- **Visual Testing**: Screenshot comparisons

### Development Server

```bash
# Start with specific port
npm run dev -- --port 3000

# Start with host binding
npm run dev -- --host 0.0.0.0
```

## 🧪 Testing

### E2E Tests with Playwright

```bash
# Run all tests
npm test

# Run tests in headed mode (visible browser)
npx playwright test --headed

# Run specific test
npx playwright test tests/browser.spec.js

# Debug tests
npx playwright test --debug
```

### Test Structure

The test suite is located in `tests/` and includes:

- `browser.spec.js` - Complete E2E test scenarios
- Browser automation for loading datasets
- Data input field validation
- URL parameter testing

### Test Scenarios

1. **Data Input Field Test**
   - Tests manual data URL entry
   - Validates dataset loading process
   - Verifies visualization rendering

2. **URL Parameter Test**
   - Tests direct URL parameter loading
   - Validates automatic dataset initialization
   - Ensures proper error handling

## 📁 Key Directories

### `src/`
Contains the main Svelte application source code:
- Components, stores, and application logic
- Data visualization components
- Zarr data loading utilities

### `static/`
Static assets served directly:
- Favicon, images, and other assets
- Public files accessible at `/filename`

### `tests/`
E2E test suite with Playwright:
- Browser automation scripts
- Test data and fixtures
- Screenshot baselines

## 🔗 Integration with Backend

The frontend integrates with the Python backend through:

### Data Loading

```javascript
// Load local data during development
const dataUrl = 'http://localhost:8000/test_data.zarr';

// Load remote data in production
const dataUrl = 'https://your-domain.com/dataset.zarr';
```

### URL Parameters

The app supports loading datasets via URL parameters:

```
# Direct dataset loading
http://localhost:5173/?data=http://example.com/dataset.zarr

# Development with local server
http://localhost:5173/?data=http://localhost:8000/test_data.zarr
```

### CORS Configuration

During development, ensure the Python CORS server is running:

```bash
# In python/ directory
uv run python src/cors_server.py --port 8000
```

## 🎨 UI/UX Features

### Interactive Visualization

- **Zooming**: Seamless zoom into time-series data
- **Panning**: Navigate through large datasets
- **Multi-channel**: Support for multiple data channels
- **Responsive**: Works on desktop and mobile devices

### Performance Optimizations

- **Lazy Loading**: Loads data chunks on demand
- **Virtual Scrolling**: Efficient rendering of large datasets
- **Web Workers**: Off-main-thread data processing
- **Canvas Rendering**: High-performance visualization

## 📊 Data Format Support

### Zarr Integration

The frontend expects Zarr datasets with this structure:

```javascript
// Expected Zarr metadata
{
  "shape": [channels, trc_files, segments, samples],
  "chunks": [1, 1, segments, chunk_size],
  "dtype": "float32",
  "compressor": "blosc"
}
```

### Supported Features

- **Multi-dimensional Arrays**: Handles 4D time-series data
- **Chunked Loading**: Efficient partial data loading
- **Compression**: Supports Blosc, gzip, and other compressors
- **Overview Pyramids**: Pre-computed zoom levels

## 🔄 Build and Deployment

### Production Build

```bash
# Create optimized build
npm run build

# Preview production build
npm run preview
```

### Build Output

The production build generates:

- **`dist/index.html`**: Main application entry point
- **`dist/assets/`**: Optimized JS, CSS, and assets
- **Tree-shaking**: Unused code elimination
- **Minification**: Compressed for production

### Deployment Options

1. **Static Hosting**: Deploy `dist/` to any static host
2. **CDN**: Use with CloudFront, Netlify, Vercel
3. **GitHub Pages**: Automated deployment via Actions
4. **Custom Server**: Serve with nginx, Apache, etc.

## 🐛 Debugging

### Development Tools

```bash
# Enable source maps in build
npm run build -- --sourcemap

# Analyze bundle size
npm run build -- --mode analyze
```

### Browser DevTools

- **Svelte DevTools**: Browser extension for Svelte debugging
- **Network Tab**: Monitor Zarr chunk loading
- **Performance Tab**: Profile rendering performance
- **Console**: Application logs and errors

### Common Issues

1. **CORS Errors**: Ensure backend CORS server is running
2. **Data Loading**: Check network tab for failed requests
3. **Performance**: Monitor chunk size and loading patterns

## 🔧 Configuration

### Vite Configuration (`vite.config.js`)

```javascript
export default {
  // Build configuration
  build: {
    target: 'es2022',
    sourcemap: true
  },
  
  // Development server
  server: {
    port: 5173,
    host: true
  }
}
```

### Playwright Configuration (`playwright.config.js`)

```javascript
export default {
  testDir: './tests',
  timeout: 30 * 1000,
  fullyParallel: true,
  
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'webkit', use: devices['Desktop Safari'] }
  ]
}
```

## 🚀 Performance Considerations

### Bundle Size

- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Eliminates unused dependencies
- **Asset Optimization**: Image and asset compression

### Runtime Performance

- **Lazy Loading**: Load data chunks on demand
- **Virtual DOM**: Efficient UI updates with Svelte
- **Web Workers**: Background data processing
- **Caching**: Browser and service worker caching

### Memory Management

- **Chunk Disposal**: Release unused data chunks
- **Efficient Rendering**: Canvas-based visualization
- **Memory Profiling**: Use browser DevTools

## 🤝 Contributing

### Adding New Features

1. Create feature branch from `main`
2. Implement feature in `src/`
3. Add E2E tests in `tests/`
4. Test with `npm test`
5. Build with `npm run build`
6. Submit pull request

### Code Style

- **ES2022**: Modern JavaScript features
- **Svelte Style**: Follow Svelte best practices
- **Type Safety**: Use JSDoc for type hints
- **Testing**: Add tests for new features

### Git Workflow

```bash
# Feature development
git checkout -b feature/new-visualization
git add .
git commit -m "Add new visualization feature"
git push origin feature/new-visualization

# Testing
npm test
npm run build
```

## 📈 Analytics and Monitoring

### Performance Monitoring

- **Web Vitals**: Core web vitals tracking
- **Error Tracking**: Client-side error monitoring
- **Usage Analytics**: User interaction tracking

### Development Metrics

```bash
# Lighthouse CI
npx lighthouse-ci autorun

# Bundle analyzer
npm run build -- --analyze
```

---

For user-focused documentation, see the [main README](../README.md).
For Python backend development, see the [Python README](../python/README.md).
