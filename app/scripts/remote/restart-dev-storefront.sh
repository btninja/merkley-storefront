#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-/home/frappe/merkley-storefront-dev/app}"

"${APP_DIR}/scripts/remote/stop-dev-storefront.sh"
"${APP_DIR}/scripts/remote/start-dev-storefront.sh"
