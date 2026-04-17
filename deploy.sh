#!/bin/bash
# ============================================================================
# Merkley Storefront — Build & Deploy (Next.js standalone)
#
# Handles the full deploy lifecycle:
#   1. Build Next.js app
#   2. Copy static assets into standalone (Next.js doesn't do this)
#   3. Sync to deploy directory
#   4. Purge nginx proxy cache (prevents stale HTML referencing old chunks)
#   5. Restart the server process
#   6. Health check
#
# Usage:
#   ./deploy.sh              Build + deploy + restart  (default)
#   ./deploy.sh build        Build + copy assets only
#   ./deploy.sh restart      Restart only (no build)
# ============================================================================

set -euo pipefail

APP_DIR="/home/frappe/merkley-storefront-dev/app"
STANDALONE="$APP_DIR/.next/standalone"
DEPLOY_DIR="/home/frappe/merkley-storefront-dev/deploy"
LOG_DIR="/home/frappe/merkley-storefront-dev/logs"
SUPERVISOR_PROG="merkley-storefront"
NGINX_CACHE_DIR="/var/cache/nginx/storefront"
PORT=3100
MODE="${1:-full}"

RED='\033[0;31m'   GREEN='\033[0;32m'
YELLOW='\033[0;33m' NC='\033[0m'

log()  { echo -e "${GREEN}[sf-deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[sf-deploy]${NC} $1"; }
err()  { echo -e "${RED}[sf-deploy]${NC} $1"; exit 1; }

mkdir -p "$LOG_DIR"

# ── Build ────────────────────────────────────────────────────────────────────

do_build() {
  cd "$APP_DIR"

  # Load env from the repo root so NEXT_PUBLIC_* values get baked into the
  # client bundle. Matches how the supervisor runtime loads the same file.
  if [ -f "/home/frappe/merkley-storefront-dev/.env.production" ]; then
    log "Loading .env.production"
    set -a
    # shellcheck disable=SC1091
    source /home/frappe/merkley-storefront-dev/.env.production
    set +a
  fi

  # Clean previous build to avoid stale manifests
  rm -rf .next node_modules/.cache

  log "Building Next.js storefront..."
  # Retry build up to 2 times (Turbopack has intermittent temp file race conditions)
  local attempt=0
  while [ $attempt -lt 3 ]; do
    attempt=$((attempt + 1))
    if npm run build 2>&1 | tail -10; then
      if [ -f "$STANDALONE/server.js" ]; then
        break
      fi
    fi
    if [ $attempt -lt 3 ]; then
      warn "Build attempt $attempt failed, retrying..."
      rm -rf .next
      sync && sleep 2
    else
      err "Build failed after 3 attempts — standalone/server.js not found."
    fi
  done

  log "Build complete — ID: $(cat .next/BUILD_ID)"

  # Copy static assets into standalone (Next.js does NOT do this automatically)
  log "Copying .next/static → standalone..."
  rm -rf "$STANDALONE/.next/static"
  cp -r "$APP_DIR/.next/static" "$STANDALONE/.next/static"

  log "Copying public → standalone..."
  rm -rf "$STANDALONE/public"
  cp -r "$APP_DIR/public" "$STANDALONE/public" 2>/dev/null || true

  # Sync to deploy dir (supervisor points here)
  log "Syncing standalone → deploy dir..."
  rsync -a --delete "$STANDALONE/" "$DEPLOY_DIR/"

  log "Assets synced."
}

# ── Purge nginx cache ────────────────────────────────────────────────────────

purge_cache() {
  log "Purging nginx proxy cache..."

  # Remove cached HTML pages (they reference old chunk hashes)
  if [ -d "$NGINX_CACHE_DIR" ]; then
    sudo find "$NGINX_CACHE_DIR" -type f -delete 2>/dev/null || true
  fi

  # Recreate cache directory structure (nginx needs this)
  sudo mkdir -p "$NGINX_CACHE_DIR"
  sudo chown www-data:www-data "$NGINX_CACHE_DIR"

  # Reload nginx to pick up the purged cache
  sudo nginx -s reload 2>/dev/null || true

  log "Cache purged."
}

# ── Restart ──────────────────────────────────────────────────────────────────

do_restart() {
  log "Restarting storefront server (port $PORT)..."

  if sudo -n supervisorctl status "$SUPERVISOR_PROG" >/dev/null 2>&1; then
    sudo -n supervisorctl restart "$SUPERVISOR_PROG"
    sleep 2

    local status
    status=$(curl -sf -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/" 2>/dev/null || echo "000")

    if [ "$status" = "000" ]; then
      warn "Server not yet responding, waiting 3s..."
      sleep 3
      status=$(curl -sf -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/" 2>/dev/null || echo "000")
    fi

    log "Restarted via Supervisor. Health: HTTP $status"
    return
  fi

  # Fallback: direct process management
  warn "Supervisor not available — manual restart."
  local pid
  pid=$(ss -tlnp | grep ":$PORT " | grep -oP 'pid=\K[0-9]+' | head -1) || true

  if [ -n "$pid" ]; then
    log "Stopping PID $pid..."
    kill "$pid" 2>/dev/null || true
    sleep 2
    kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true
    sleep 1
  fi

  cd "$DEPLOY_DIR"
  PORT=$PORT HOSTNAME=127.0.0.1 NODE_ENV=production \
    nohup node server.js >> "$LOG_DIR/storefront.log" 2>> "$LOG_DIR/storefront.error.log" &
  local new_pid=$!
  log "Started (PID: $new_pid)"

  sleep 3
  local status
  status=$(curl -sf -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/" 2>/dev/null || echo "000")
  log "Health: HTTP $status"
}

# ── Verify ───────────────────────────────────────────────────────────────────

verify_chunks() {
  log "Verifying chunks are accessible..."

  # Get CSS and first JS chunk from the live HTML
  local html
  html=$(curl -sf "http://127.0.0.1:$PORT/" 2>/dev/null || echo "")

  if [ -z "$html" ]; then
    warn "Could not fetch HTML for verification"
    return
  fi

  local css
  css=$(echo "$html" | grep -o '_next/static/css/[^"]*' | head -1)
  local js
  js=$(echo "$html" | grep -o '_next/static/chunks/webpack[^"]*' | head -1)

  if [ -n "$css" ]; then
    local css_status
    css_status=$(curl -sf -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/$css" 2>/dev/null || echo "000")
    if [ "$css_status" = "200" ]; then
      log "CSS chunk OK: $css → $css_status"
    else
      warn "CSS chunk FAILED: $css → $css_status"
    fi
  fi

  if [ -n "$js" ]; then
    local js_status
    js_status=$(curl -sf -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/$js" 2>/dev/null || echo "000")
    if [ "$js_status" = "200" ]; then
      log "JS chunk OK: $js → $js_status"
    else
      warn "JS chunk FAILED: $js → $js_status"
    fi
  fi
}

# ── Main ─────────────────────────────────────────────────────────────────────

case "$MODE" in
  build)
    do_build
    warn "Build-only — server NOT restarted. Run './deploy.sh restart' to apply."
    ;;
  restart)
    do_restart
    purge_cache
    ;;
  full|*)
    do_build
    do_restart
    purge_cache
    verify_chunks
    log "Deploy complete!"
    ;;
esac
