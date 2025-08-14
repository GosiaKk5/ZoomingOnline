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
   cd app
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   cd app
   npx playwright install
   ```

3. Start a local web server to serve the application:
   ```bash
   python src/cors_server.py
   ```

4. Run the tests:
   ```bash
   cd app
   npm test
   ```

Alternatively, use the provided script that automates these steps:
```bash
./run_browser_tests.sh
```

### Test Data

The tests can use either:

1. **Remote data** - The 1nA dataset hosted on Cyfronet S3:
   ```
   https://s3.cloud.cyfronet.pl/zooming-online/1nA/1nA.zarr
   ```

2. **Local data** - Generated test data with minimal parameters:
   - 1 channel
   - 1 TRC file
   - 1 segment
   - 1,000,000 data samples

### Configurable Data Source

The test suite is configurable to use either remote S3 data or locally generated data:

```bash
# Use S3 data (default)
./run_browser_tests.sh

# Use locally generated data
./run_browser_tests.sh --local

# Generate new test data and use it
./run_browser_tests.sh --generate
```

### Continuous Integration

The GitHub Actions workflow performs the following steps:

1. **Data Generation**
   - Generates a minimal test dataset with:
     - 1 channel
     - 1 TRC file
     - 1 segment
     - 1,000,000 data samples

2. **Local Server Setup**
   - Starts a local web server to serve both the application and the test data

3. **Browser Tests**
   - Runs Playwright tests against the local server
   - Uses the locally generated data to avoid reliance on external services

These tests run automatically:
- On every push to the main branch
- On every pull request
- Once per week (scheduled)

The workflow is defined in `.github/workflows/app-tests.yml`.

### Viewing Test Results

After running the tests either locally or in CI, you can view the HTML report:

```bash
cd app
npx playwright show-report
```

In CI, the report and screenshots are uploaded as artifacts for easy access.


## Manual Testing

For manual testing:

1. Start the local server:
   ```bash
   python src/cors_server.py
   ```

2. Start the Svelte development server:
   ```bash
   cd app
   npm run dev
   ```

3. Navigate to http://localhost:5173/ in your browser

4. Test with different datasets:
   - Enter a dataset URL in the input field
   - Use the URL parameter: http://localhost:5173/?data=URL
   
4. Verify visualization features:
   - Select different channels, TRC files, and segments
   - Test zooming functionality
   - Verify data display accuracy
