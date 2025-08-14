#!/usr/bin/env bash
set -e

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
if [ ! -d "app/node_modules" ]; then
  echo "Installing Node.js dependencies..."
  cd app
  npm install
  cd ..
fi

# Install Playwright browsers if needed
echo "Installing Playwright browsers..."
cd app
npx playwright install --with-deps chromium
cd ..

# If using local data and need to generate it
if [ "$GENERATE_DATA" = true ]; then
  echo "Generating minimal test data for quick testing..."
  python src/generate_data.py -o test_data.zarr --minimal
fi

# Start local server for the Svelte app
echo "Starting local development server..."
cd app
npm run dev &
SERVER_PID=$!
cd ..

# Function to clean up server process on exit
cleanup() {
  echo "Cleaning up server process..."
  # First try graceful termination
  kill -TERM $SERVER_PID 2>/dev/null || true
  
  # Wait a moment for the process to terminate
  sleep 1
  
  # If process is still running, force kill it
  if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "Server process didn't terminate gracefully, forcing shutdown..."
    kill -KILL $SERVER_PID 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Wait for server to start
sleep 2

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
cd app
if [ -n "$CI" ]; then
  # When running in CI, explicitly set CI=true for Playwright to use our CI-specific config
  CI=true npx playwright test ../tests/browser.spec.js
else
  # For local runs, use standard configuration
  npx playwright test ../tests/browser.spec.js
fi
cd ..

echo "All tests completed successfully!"
