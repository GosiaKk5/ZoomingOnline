# ZoomingOnline Testing Documentation

This document provides comprehensive information about testing procedures for the ZoomingOnline project.

## Testing Overview

The project includes two types of tests:

### Unit Tests (JavaScript)

Unit tests are located in the `app/` directory and test individual functions and components using vitest with jsdom environment simulation.

To run unit tests:
```bash
cd app
npm test
```

These tests cover core functionality including:
- Time calculations and domain generation
- Data processing utilities
- Component behavior validation

### Browser Tests (Playwright)

Browser tests use Playwright to test the complete application workflow in a real browser environment.

## Browser Tests

The project includes automated browser tests using Playwright that verify the web application loads correctly, can access data files, and properly renders visualizations.

### Test Cases

The browser tests verify several key functionalities:

1. **Loading the Application**: Tests that the application loads correctly
2. **Loading Data via URL Parameter**: Tests loading data specified in a URL parameter
3. **Loading Data via Input Field**: Tests entering a URL into the input field and loading data
4. **Visualization Rendering**: Tests that charts and controls render correctly
5. **User Interface Interaction**: Tests slider manipulation and control updates

### Running Browser Tests Locally

To run browser tests locally:

1. Install Node.js dependencies:
   ```bash
   cd app
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   cd app
   npx playwright install
   ```

3. Run the browser tests:
   ```bash
   cd app
   npm run test:browser
   ```

This command automatically:
- Builds the application for production
- Starts a preview server on port 5173
- Runs Playwright tests against the local server
- Uses local test data to avoid external dependencies
- Cleans up the server after tests complete

### Test Data

The browser tests use local test data located in:
- `app/public/example.zarr/` - Sample dataset for testing

This ensures tests are reproducible and don't depend on external services. The local data includes:
- 1 channel
- 1 TRC file  
- 1 segment
- 1,000,000 data samples

### Test Configuration

Browser tests are configured in `playwright.config.js`:
- Uses Chromium browser for consistency
- 60-second timeout for data loading operations
- Local data mode enabled with `USE_LOCAL_DATA=true`
- Automatic server startup and teardown

### Continuous Integration

The GitHub Actions workflow automatically runs both test suites on:
- Every push to the main branch
- Every pull request
- Weekly scheduled runs (Monday at 00:00 UTC)

The CI pipeline performs these steps:

1. **Setup Environment**
   - Installs Node.js dependencies
   - Caches Playwright browsers for performance

2. **Application Build**
   - Builds the application for production-like testing
   - Starts preview server with local data

3. **Test Execution**
   - Runs browser tests using local zarr data
   - Uploads test reports and screenshots as artifacts

The workflow is defined in `.github/workflows/app-tests.yml`.

### Viewing Test Results

After running tests locally, you can view the HTML report:

```bash
cd app
npx playwright show-report
```

In CI, test reports and screenshots are automatically uploaded as artifacts for easy access when tests fail.

## Manual Testing

For manual testing and development:

1. Start the Svelte development server:
   ```bash
   cd app
   npm run dev
   ```

2. Navigate to http://localhost:5173/ in your browser

3. Test with different datasets:
   - Enter a dataset URL in the input field
   - Use the URL parameter: http://localhost:5173/?data=URL
   
4. Verify visualization features:
   - Select different channels, TRC files, and segments
   - Test zooming functionality with the provided zoom domains
   - Verify data display accuracy and time formatting

## Test Maintenance

- Unit tests should be updated when modifying core utility functions
- Browser tests should be updated when changing UI workflows
- Test data can be regenerated using the Python utilities in the `python/` directory
- All tests use local data to ensure consistent, fast execution
