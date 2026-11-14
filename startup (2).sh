#!/usr/bin/env bash
# SharpTech Academy - startup script
# This script starts the dev server on 0.0.0.0:8080

set -euo pipefail

# Probe the dev server
if curl -fsS "http://127.0.0.1:8080/" >/dev/null 2>&1; then
  echo "Dev server already healthy on port 8080"
  exit 0
fi

echo "Starting dev server..."
cd "$(dirname "$0")"
npm run dev > /tmp/vite-dev.log 2>&1 &

# Wait for server to be ready
for i in {1..30}; do
  if curl -fsS "http://127.0.0.1:8080/" >/dev/null 2>&1; then
    echo "Dev server ready on 0.0.0.0:8080"
    exit 0
  fi
  sleep 1
done

echo "Dev server failed to start"
cat /tmp/vite-dev.log
exit 1