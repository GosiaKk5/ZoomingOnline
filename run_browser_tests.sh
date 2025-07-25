#!/usr/bin/env bash
set -e

# Generate sample data for tests
echo "Generating sample data..."
python src/generate_data.py -o waveform.zarr

# Start local server
echo "Starting local server..."
python src/cors_server.py --port 8000 &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Function to clean up server process on exit
cleanup() {
  echo "Cleaning up server process..."
  kill $SERVER_PID
}
trap cleanup EXIT

# Install Node.js dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing Node.js dependencies..."
  npm install
fi

# Install Playwright browsers if needed
echo "Installing Playwright browsers..."
npx playwright install --with-deps chromium

# Run the tests
echo "Running Playwright tests..."
npx playwright test

echo "All tests completed successfully!"
