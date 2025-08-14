#!/usr/bin/env bash
set -e

# Detect if we're being called from app directory or root directory
if [ -f "package.json" ] && [ -f "playwright.config.js" ]; then
  # We're in the app directory
  IN_APP_DIR=true
  PROJECT_ROOT=".."
else
  # We're in the root directory
  IN_APP_DIR=false
  PROJECT_ROOT="."
fi

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
if [ "$IN_APP_DIR" = true ]; then
  if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
  fi
else
  if [ ! -d "app/node_modules" ]; then
    echo "Installing Node.js dependencies..."
    cd app
    npm install
    cd ..
  fi
fi

# Install Playwright browsers if needed
echo "Installing Playwright browsers..."
if [ "$IN_APP_DIR" = true ]; then
  npx playwright install --with-deps chromium
else
  cd app
  npx playwright install --with-deps chromium
  cd ..
fi

# If using local data and need to generate it
if [ "$GENERATE_DATA" = true ]; then
  echo "Generating minimal test data for quick testing..."
  if [ "$IN_APP_DIR" = true ]; then
    python ../src/generate_data.py -o ../test_data.zarr --minimal
  else
    python src/generate_data.py -o test_data.zarr --minimal
  fi
fi

# Start local server for the Svelte app
echo "Starting local development server..."
if [ "$IN_APP_DIR" = true ]; then
  npm run dev &
  SVELTE_SERVER_PID=$!
else
  cd app
  npm run dev &
  SVELTE_SERVER_PID=$!
  cd ..
fi

# Start CORS server for serving test data
echo "Starting CORS server for test data..."
if [ "$IN_APP_DIR" = true ]; then
  python ../src/cors_server.py --port 8000 &
  CORS_SERVER_PID=$!
else
  python src/cors_server.py --port 8000 &
  CORS_SERVER_PID=$!
fi

# Function to clean up server processes on exit
cleanup() {
  echo "Cleaning up server processes..."
  # First try graceful termination
  kill -TERM $SVELTE_SERVER_PID 2>/dev/null || true
  kill -TERM $CORS_SERVER_PID 2>/dev/null || true
  
  # Wait a moment for the processes to terminate
  sleep 1
  
  # If processes are still running, force kill them
  if ps -p $SVELTE_SERVER_PID > /dev/null 2>&1; then
    echo "Svelte server process didn't terminate gracefully, forcing shutdown..."
    kill -KILL $SVELTE_SERVER_PID 2>/dev/null || true
  fi
  
  if ps -p $CORS_SERVER_PID > /dev/null 2>&1; then
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
if [ "$IN_APP_DIR" = true ]; then
  if [ -n "$CI" ]; then
    # When running in CI, explicitly set CI=true for Playwright to use our CI-specific config
    CI=true npx playwright test ../tests/browser.spec.js
  else
    # For local runs, use standard configuration
    npx playwright test ../tests/browser.spec.js
  fi
else
  cd app
  if [ -n "$CI" ]; then
    # When running in CI, explicitly set CI=true for Playwright to use our CI-specific config
    CI=true npx playwright test ../tests/browser.spec.js
  else
    # For local runs, use standard configuration
    npx playwright test ../tests/browser.spec.js
  fi
  cd ..
fi

echo "All tests completed successfully!"
