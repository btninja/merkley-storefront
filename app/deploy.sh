#!/bin/bash
# ============================================================================
# DEPLOY SCRIPT for Merkley Storefront (Next.js standalone)
# ============================================================================
#
# IMPORTANT: After every `npm run build`, you MUST run this script to:
#   1. Copy static files into the standalone directory
#   2. Copy public files into the standalone directory
#   3. Restart the Next.js server
#
# Without this, the frontend will 404 on assets because the standalone
# server references new chunk hashes but the static files aren't there.
#
# Usage:
#   cd /home/frappe/merkley-storefront-dev/app
#   bash deploy.sh
#
# ============================================================================

set -e

APP_DIR="/home/frappe/merkley-storefront-dev/app"
PORT=3100

cd "$APP_DIR"

echo "==> Copying static files to standalone..."
cp -r .next/static .next/standalone/.next/static

echo "==> Copying public files to standalone..."
cp -r public .next/standalone/public 2>/dev/null || true

echo "==> Killing old server on port $PORT..."
PID=$(ss -tlnp | grep ":$PORT " | grep -oP 'pid=\K[0-9]+' | head -1) || true
if [ -n "$PID" ]; then
  kill "$PID" && sleep 1
  echo "    Killed PID $PID"
else
  echo "    No process found on port $PORT"
fi

echo "==> Starting new server..."
cd .next/standalone
PORT=$PORT HOSTNAME=0.0.0.0 node server.js > /tmp/storefront.log 2>&1 &
sleep 2

# Verify
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/")
if [ "$HTTP_CODE" = "200" ]; then
  echo "==> Server started successfully on port $PORT (HTTP $HTTP_CODE)"
else
  echo "==> WARNING: Server returned HTTP $HTTP_CODE"
  echo "    Check /tmp/storefront.log for errors"
  exit 1
fi
