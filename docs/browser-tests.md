# Browser Tests Documentation

This document provides details on the browser tests implemented for ZoomingOnline.

## Overview

The browser tests use Playwright to verify that the ZoomingOnline web application loads and functions correctly. The tests check:

1. Loading the application
2. Loading data from remote and local sources
3. Selecting channels, TRC files, and segments
4. Checking that visualizations render correctly

## Test Cases

### 1. Loading Remote Data via URL Parameter

This test verifies that the application can correctly load data specified in the URL parameter.
The test:
- Navigates to the app with a data parameter pointing to a remote dataset
- Verifies the data loads successfully
- Selects specific channel, TRC file, and segment
- Verifies that the plots are generated and displayed correctly

### 2. Loading Remote Data via Input Field

This test verifies that a user can enter a URL into the input field and load data.
The test:
- Navigates to the app
- Enters a remote dataset URL into the input field
- Clicks the load button
- Verifies the data loads successfully
- Selects specific channel, TRC file, and segment
- Verifies that the plots are generated and displayed correctly

### 3. Loading Locally Generated Data

This test verifies that the application works with locally hosted data.
The test:
- Navigates to the app
- Enters a URL pointing to the locally generated dataset
- Verifies the data loads successfully
- Tests the interactive controls for the visualization

## Running Tests Locally

1. Ensure you have Node.js installed
2. Install dependencies with `npm install`
3. Install Playwright browsers with `npx playwright install`
4. Run the local server: `python src/cors_server.py`
5. Generate test data: `python src/generate_data.py -o waveform.zarr`
6. Run the tests: `npx playwright test`

Alternatively, you can use the provided script:
```bash
./run_browser_tests.sh
```

## CI Integration

These tests run automatically in GitHub Actions:
- On every push to the main branch
- On every pull request
- Once per week (scheduled)

The workflow is defined in `.github/workflows/app-tests.yml`.

## Viewing Test Results

After running the tests either locally or in CI, you can view the HTML report by opening the `playwright-report/index.html` file.
In CI, the report and screenshots are uploaded as artifacts for easy access.
