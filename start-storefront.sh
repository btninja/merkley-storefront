#!/bin/bash
set -a
source /home/frappe/merkley-storefront-dev/.env.production
set +a
exec /home/frappe/.local/bin/node /home/frappe/merkley-storefront-dev/deploy/server.js
