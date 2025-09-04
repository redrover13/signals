#!/bin/bash
set -euo pipefail

# Navigate to the project root (use repo root or relative path)
ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"
cd "${ROOT_DIR}" || { echo "Failed to cd to repo root: ${ROOT_DIR}"; exit 1; }

# Ensure pnpm is available
command -v pnpm >/dev/null 2>&1 || { echo "pnpm is not installed or not in PATH"; exit 127; }

# Run lint with autofix option
pnpm nx run signals:lint --fix

# Show any remaining issues (do not ignore exit code)
pnpm nx run signals:lint
