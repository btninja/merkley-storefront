#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-/home/frappe/merkley-storefront-dev/app}"
HOSTNAME="${HOSTNAME:-127.0.0.1}"
PORT="${PORT:-3100}"
RUN_DIR="${APP_DIR}/.run"
LOG_DIR="${APP_DIR}/.logs"
PID_FILE="${RUN_DIR}/dev-storefront.pid"
LOG_FILE="${LOG_DIR}/dev-storefront.log"

mkdir -p "${RUN_DIR}" "${LOG_DIR}"

if [[ -f "${PID_FILE}" ]]; then
  EXISTING_PID="$(cat "${PID_FILE}")"
  if kill -0 "${EXISTING_PID}" 2>/dev/null; then
    exit 0
  fi
  rm -f "${PID_FILE}"
fi

if [[ ! -f "${APP_DIR}/.next/standalone/server.js" ]]; then
  echo "Build output not found in ${APP_DIR}/.next/standalone/server.js" >&2
  exit 1
fi

cd "${APP_DIR}"

nohup env \
  HOSTNAME="${HOSTNAME}" \
  NODE_ENV=production \
  PORT="${PORT}" \
  node .next/standalone/server.js >> "${LOG_FILE}" 2>&1 &

echo $! > "${PID_FILE}"
sleep 2
kill -0 "$(cat "${PID_FILE}")"
