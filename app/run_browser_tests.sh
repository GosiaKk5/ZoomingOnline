#!/usr/bin/env bash
set -e

# This script should be run from the app directory

# Parse command line options
USE_LOCAL_DATA=false
GENERATE_DATA=false

while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --local)
      USE_LOCAL_DATA=true
      shift
      ;;
    --generate)
      GENERATE_DATA=true
      USE_LOCAL_DATA=true
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --local     Use locally generated data instead of S3"
      echo "  --generate  Generate new test data (implies --local)"
      echo "  --help      Show this help message"
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

# If using remote data, check connectivity
if [ "$USE_LOCAL_DATA" = false ]; then
  echo "Testing connectivity to Cyfronet S3..."
  if wget -q --spider https://s3.cloud.cyfronet.pl/zooming-online/1nA/1nA.zarr/.zgroup; then
    echo "✅ Connection to Cyfronet S3 successful"
  else
    echo "❌ Connection to Cyfronet S3 failed"
    echo "Consider using --local option to use locally generated data"
    exit 1
  fi
fi

# Install Node.js dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing Node.js dependencies..."
  npm install
fi

# Install Playwright browsers if needed
echo "Installing Playwright browsers..."
npx playwright install --with-deps chromium

# If using local data and need to generate it
if [ "$GENERATE_DATA" = true ]; then
  echo "Generating minimal test data for quick testing..."
  python ../python/src/generate_data.py -o ../test_data.zarr --minimal
  # Copy to app/public so it's served as a static file
  echo "Copying test data to app/public as example.zarr..."
  cp -r ../test_data.zarr ./public/example.zarr
fi

# Start local server for the Svelte app
echo "Starting local development server..."
npm run dev &
SVELTE_SERVER_PID=$!

# Only start CORS server for non-local data testing
if [ "$USE_LOCAL_DATA" = false ]; then
  echo "Starting CORS server for remote data testing..."
  python ../python/src/cors_server.py --port 8000 &
  CORS_SERVER_PID=$!
fi

# Function to clean up server processes on exit
cleanup() {
  echo "Cleaning up server processes..."
  # First try graceful termination
  kill -TERM $SVELTE_SERVER_PID 2>/dev/null || true
  if [ -n "$CORS_SERVER_PID" ]; then
    kill -TERM $CORS_SERVER_PID 2>/dev/null || true
  fi
  
  # Wait a moment for the processes to terminate
  sleep 1
  
  # If processes are still running, force kill them
  if ps -p $SVELTE_SERVER_PID > /dev/null 2>&1; then
    echo "Svelte server process didn't terminate gracefully, forcing shutdown..."
    kill -KILL $SVELTE_SERVER_PID 2>/dev/null || true
  fi
  
  if [ -n "$CORS_SERVER_PID" ] && ps -p $CORS_SERVER_PID > /dev/null 2>&1; then
    echo "CORS server process didn't terminate gracefully, forcing shutdown..."
    kill -KILL $CORS_SERVER_PID 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Wait for servers to start
sleep 3

# Set environment variables for tests
if [ "$USE_LOCAL_DATA" = true ]; then
  echo "Running tests with locally generated data..."
  export USE_LOCAL_DATA=true
else
  echo "Running tests with S3 data..."
  export USE_LOCAL_DATA=false
fi

# Run the tests
echo "Running Playwright tests..."
if [ -n "$CI" ]; then
  # When running in CI, explicitly set CI=true for Playwright to use our CI-specific config
  CI=true npx playwright test tests/browser.spec.js
else
  # For local runs, use standard configuration
  npx playwright test tests/browser.spec.js
fi

echo "All tests completed successfully!"
