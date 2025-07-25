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
if [ ! -d "node_modules" ]; then
  echo "Installing Node.js dependencies..."
  npm install
fi

# Install Playwright browsers if needed
echo "Installing Playwright browsers..."
npx playwright install --with-deps chromium

# If using local data and need to generate it
if [ "$GENERATE_DATA" = true ]; then
  echo "Generating test data..."
  python src/generate_data.py -o test_data.zarr --channels 2 --trcs 3 --samples 10000000
fi

# Start local server
echo "Starting local server..."
python src/cors_server.py --port 8000 &
SERVER_PID=$!

# Function to clean up server process on exit
cleanup() {
  echo "Cleaning up server process..."
  kill $SERVER_PID
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
npx playwright test tests/browser.spec.js

echo "All tests completed successfully!"
