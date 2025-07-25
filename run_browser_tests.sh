#!/usr/bin/env bash
set -e

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
