# ZoomingOnline Testing Documentation

This document provides comprehensive information about testing procedures for the ZoomingOnline project.

## Browser Tests

The project includes automated browser tests using Playwright. These tests verify that the web application loads correctly, can access data files, and properly renders visualizations.

### Test Cases

The browser tests verify several key functionalities:

1. **Loading the Application**: Tests that the application loads correctly
2. **Loading Data via URL Parameter**: Tests loading data specified in a URL parameter
3. **Loading Data via Input Field**: Tests entering a URL into the input field and loading data
4. **Visualization Rendering**: Tests that charts and controls render correctly
5. **User Interface Interaction**: Tests slider manipulation and control updates

### Running Tests Locally

To run the browser tests locally:

1. Install Node.js dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

3. Start a local web server to serve the application:
   ```bash
   python src/cors_server.py
   ```

4. Run the tests:
   ```bash
   npm test
   ```

Alternatively, use the provided script that automates these steps:
```bash
./run_browser_tests.sh
```

### Test Data

The tests exclusively use the 1nA dataset hosted on Cyfronet S3:
```
https://s3.cloud.cyfronet.pl/zooming-online/1nA/1nA.zarr
```

### S3 Connectivity Tests

Before running the browser tests, you can verify connectivity to the Cyfronet S3 storage:

```bash
./tests/test_s3_connectivity.sh
```

This script tests:
1. Basic connectivity to the S3 storage
2. Ability to download actual files from the storage

### Continuous Integration

The testing process in GitHub Actions consists of two jobs:

1. **S3 Connectivity Test**
   - Verifies that GitHub Actions runners can access the Cyfronet S3 storage
   - Tests downloading a small file from the S3 bucket
   - Fails fast if connectivity issues are detected

2. **Browser Tests**
   - Runs only if the connectivity test passes
   - Starts a local web server to serve the application
   - Runs the Playwright tests against the local server

These tests run automatically:
- On every push to the main branch
- On every pull request
- Once per week (scheduled)

The workflow is defined in `.github/workflows/app-tests.yml`.

### Viewing Test Results

After running the tests either locally or in CI, you can view the HTML report:

```bash
npx playwright show-report
```

In CI, the report and screenshots are uploaded as artifacts for easy access.

## Network Connectivity Tests

The project includes network tests that verify connectivity to required external resources, particularly the S3 storage hosting the datasets.

These tests check that:
1. The application can access the Cyfronet S3 storage
2. Required data files are available and accessible
3. Network conditions allow proper data loading

## Manual Testing

For manual testing:

1. Start the local server:
   ```bash
   python src/cors_server.py
   ```

2. Navigate to http://localhost:8000/website/ in your browser

3. Test with different datasets:
   - Enter a dataset URL in the input field
   - Use the URL parameter: http://localhost:8000/website/?data=URL
   
4. Verify visualization features:
   - Select different channels, TRC files, and segments
   - Test zooming functionality
   - Verify data display accuracy
