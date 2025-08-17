# Svelte + TypeScript Frontend - Developer Guide

This directory contains the Svelte + TypeScript frontend application for ZoomingOnline. The application provides an interactive web interface for visualizing and exploring large time-series datasets stored in Zarr format with full type safety.

## 🏗️ Architecture

The frontend is built with modern web technologies and organized as follows:

```
app/
├── src/                   # TypeScript source code
│   ├── components/        # Svelte components
│   ├── stores/           # Svelte stores (TypeScript)
│   ├── utils/            # Utility functions (TypeScript)
│   └── routes/           # Application routes
├── static/               # Static assets
├── tests/                # E2E tests with Playwright
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
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
cd app
```

**Automated Setup (Recommended):**

```bash
./setup-dev.sh
```

**Manual Setup:**

```bash
npm install
```

```bash
npm run validate  # Verify setup
```

```bash
npm run dev
```

Open browser to http://localhost:5173

## 📦 Available Scripts

| Command                | Purpose                  | Usage                                |
| ---------------------- | ------------------------ | ------------------------------------ |
| `npm run dev`          | Start development server | Local development with hot reload    |
| `npm run build`        | Production build         | Generates optimized build in `dist/` |
| `npm run preview`      | Preview production build | Test production build locally        |
| `npm run check`        | TypeScript type checking | Validate types with svelte-check     |
| `npm run check:watch`  | Watch mode type checking | Continuous type validation           |
| `npm run lint`         | Run ESLint               | Check code quality and style         |
| `npm run lint:fix`     | Fix ESLint issues        | Automatically fix linting problems   |
| `npm run format`       | Format code              | Apply Prettier formatting            |
| `npm run format:check` | Check formatting         | Verify code is properly formatted    |
| `npm run validate`     | Run all quality checks   | Complete validation pipeline         |
| `npm run test:unit`    | Run unit tests           | Vitest-based unit tests              |
| `npm run test:headed`  | Run E2E tests (headed)   | Playwright browser tests with UI     |

## 🔧 Development Tools

### Code Quality & Linting

- **ESLint**: Comprehensive linting for TypeScript and Svelte files
- **Prettier**: Consistent code formatting across the project
- **GitHub Actions**: Continuous integration with quality checks

See [../docs/linting.md](../docs/linting.md) for detailed linting setup and configuration.

### TypeScript Integration

- **Full Type Safety**: All source code is written in TypeScript
- **Svelte TypeScript Support**: Native TypeScript support in Svelte components
- **Type Checking**: Integrated with svelte-check for comprehensive validation
- **Math.js Integration**: Proper type-safe integration with mathematical utilities

### Build System

- **Vite**: Fast build tool with TypeScript support
- **ES Modules**: Native ES module support
- **Hot Module Replacement**: Instant updates during development

### Testing

- **Vitest**: Unit testing framework with TypeScript support
- **Playwright**: E2E browser testing
- **Multi-browser**: Tests on Chromium, Firefox, and WebKit
- **Type-safe Tests**: All test files written in TypeScript

### Development Server

```bash
npm run dev -- --port 3000
```

```bash
npm run dev -- --host 0.0.0.0
```

## 🧪 Testing

### TypeScript Type Checking

```bash
npm run check
```

```bash
npm run check:watch
```

### Unit Tests with Vitest

```bash
npm run test:unit
```

### E2E Tests with Playwright

```bash
npm run test:headed
```

```bash
npx playwright test --headed
```

```bash
npx playwright test tests/browser.spec.js
```

```bash
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
// Load example data (included as static file)
const dataUrl = `${window.location.origin}${import.meta.env.BASE_URL}example.zarr`;

// Load remote data in production
const dataUrl = "https://your-domain.com/dataset.zarr";
```

### URL Parameters

The app supports loading datasets via URL parameters:

```
# Load example dataset (included as static file)
http://localhost:5173/ZoomingOnline/?data=http://localhost:5173/ZoomingOnline/example.zarr

# Direct dataset loading
http://localhost:5173/?data=http://example.com/dataset.zarr
```

### Development with Static Files

The app includes a small example.zarr file (288KB) for testing and development. No additional CORS server is needed for the example data.

### CORS Configuration

For custom datasets during development, ensure the Python CORS server is running:

```bash
cd ../python
```

```bash
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
npm run build
```

```bash
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
npm run build -- --sourcemap
```

```bash
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
    target: "es2022",
    sourcemap: true,
  },

  // Development server
  server: {
    port: 5173,
    host: true,
  },
};
```

### Playwright Configuration (`playwright.config.js`)

```javascript
export default {
  testDir: "./tests",
  timeout: 30 * 1000,
  fullyParallel: true,

  projects: [
    { name: "chromium", use: devices["Desktop Chrome"] },
    { name: "firefox", use: devices["Desktop Firefox"] },
    { name: "webkit", use: devices["Desktop Safari"] },
  ],
};
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

- **TypeScript**: Full type safety with strict mode enabled
- **ES2022**: Modern JavaScript features
- **Svelte Style**: Follow Svelte best practices with TypeScript
- **Type Annotations**: Comprehensive type coverage
- **Testing**: Add tests for new features

### Git Workflow

```bash
git checkout -b feature/new-visualization
```

```bash
git add .
```

```bash
git commit -m "Add new visualization feature"
```

```bash
git push origin feature/new-visualization
```

```bash
npm test
```

```bash
npm run build
```

## 📈 Analytics and Monitoring

### Performance Monitoring

- **Web Vitals**: Core web vitals tracking
- **Error Tracking**: Client-side error monitoring
- **Usage Analytics**: User interaction tracking

### Development Metrics

```bash
npx lighthouse-ci autorun
```

```bash
npm run build -- --analyze
```

---

For user-focused documentation, see the [main README](../README.md).
For Python backend development, see the [Python README](../python/README.md).
