#!/usr/bin/env bash
set -e

# Test connectivity to Cyfronet S3 
echo "Testing connectivity to Cyfronet S3..."
if wget -q --spider https://s3.cloud.cyfronet.pl/zooming-online/1nA/1nA.zarr/.zgroup; then
  echo "✅ Connection to Cyfronet S3 successful"
else
  echo "❌ Connection to Cyfronet S3 failed"
  exit 1
fi

# Download a small file to verify content access
echo "Testing file download from Cyfronet S3..."
wget -q -O /tmp/zgroup https://s3.cloud.cyfronet.pl/zooming-online/1nA/1nA.zarr/.zgroup
if [ -s /tmp/zgroup ]; then
  echo "✅ Successfully downloaded test file"
  cat /tmp/zgroup
else
  echo "❌ Failed to download test file"
  exit 1
fi

echo "✅ S3 connectivity test passed successfully"
