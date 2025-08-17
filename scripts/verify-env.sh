#!/bin/bash
set -e

NODE_VERSION=$(node -v 2>/dev/null || echo "missing")
PNPM_VERSION=$(pnpm -v 2>/dev/null || echo "missing")
NX_VERSION=$(pnpm exec nx --version 2>/dev/null || echo "missing")

if [[ "$NODE_VERSION" == "missing" ]]; then
  echo "Node.js not found"; exit 1
fi
if [[ "$PNPM_VERSION" == "missing" ]]; then
  echo "pnpm not found"; exit 1
fi
if [[ "$NX_VERSION" == "missing" ]]; then
  echo "Nx not found"; exit 1
fi

echo "Node: $NODE_VERSION"
echo "pnpm: $PNPM_VERSION"
echo "Nx: $NX_VERSION"
echo "Environment OK"
