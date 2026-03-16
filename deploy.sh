#!/bin/bash
# ============================================================================
# Merkley Storefront — Build & Deploy (Next.js standalone)
#
# Next.js standalone output does NOT include /public or /.next/static.
# After every build these must be copied in, then the server restarted.
# Skipping this causes 404s on JS/CSS chunks.
#
# Usage:
#   ./deploy.sh              Build + copy assets + restart  (default)
#   ./deploy.sh build        Build + copy assets only
#   ./deploy.sh restart      Restart only (no build)
# ============================================================================

set -euo pipefail

APP_DIR="/home/frappe/merkley-storefront-dev/app"
STANDALONE="$APP_DIR/.next/standalone"
DEPLOY_DIR="/home/frappe/merkley-storefront-dev/deploy"
LOG_DIR="/home/frappe/merkley-storefront-dev/logs"
SUPERVISOR_PROG="merkley-storefront"
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

  log "Building Next.js storefront..."
  npm run build 2>&1 | tail -10

  if [ ! -f "$STANDALONE/server.js" ]; then
    err "Build failed — standalone/server.js not found."
  fi

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

# ── Main ─────────────────────────────────────────────────────────────────────

case "$MODE" in
  build)
    do_build
    warn "Build-only — server NOT restarted. Run './deploy.sh restart' to apply."
    ;;
  restart)
    do_restart
    ;;
  full|*)
    do_build
    do_restart
    log "Deploy complete!"
    ;;
esac
