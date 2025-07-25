#!/usr/bin/env bash
set -e

# First test connectivity to Cyfronet S3
echo "Testing connectivity to Cyfronet S3..."
if wget -q --spider https://s3.cloud.cyfronet.pl/zooming-online/1nA/1nA.zarr/.zgroup; then
  echo "✅ Connection to Cyfronet S3 successful"
else
  echo "❌ Connection to Cyfronet S3 failed"
  exit 1
fi

# Install Node.js dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing Node.js dependencies..."
  npm install
fi

# Install Playwright browsers if needed
echo "Installing Playwright browsers..."
npx playwright install --with-deps chromium

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

# Run the tests
echo "Running Playwright tests..."
npx playwright test tests/browser.spec.js

echo "All tests completed successfully!"
