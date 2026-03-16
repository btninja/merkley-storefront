#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-/home/frappe/merkley-storefront-dev/app}"
PID_FILE="${APP_DIR}/.run/dev-storefront.pid"

if [[ ! -f "${PID_FILE}" ]]; then
  exit 0
fi

PID="$(cat "${PID_FILE}")"

if kill -0 "${PID}" 2>/dev/null; then
  kill "${PID}"

  for _ in {1..10}; do
    if ! kill -0 "${PID}" 2>/dev/null; then
      rm -f "${PID_FILE}"
      exit 0
    fi
    sleep 1
  done

  kill -9 "${PID}" 2>/dev/null || true
fi

rm -f "${PID_FILE}"
