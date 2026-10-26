#!/usr/bin/env bash
set -euo pipefail

node --version
npm --version
npm ci --no-audit --no-fund
npm run verify
