#!/usr/bin/env bash
set -uo pipefail
# Lightweight repo scan-and-fix helper.
# - Searches for common error patterns
# - Runs prettier and eslint --fix if available via pnpm
# - Runs TypeScript diagnostics (tsc --noEmit)
# - Writes results to scripts/scan-and-fix-results/

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT_DIR/scripts/scan-and-fix-results"
mkdir -p "$OUT_DIR"

echo "scan-and-fix: starting at $(date)" > "$OUT_DIR/report.txt"

patterns=(
  "SyntaxError"
  "Unexpected token"
  "Unexpected identifier"
  "Unexpected end of input"
  "TS2304" # cannot find name
  "TS2339" # property does not exist
  "TS2551" # property not found on type
)

echo "Searching for common patterns..." >> "$OUT_DIR/report.txt"
for p in "${patterns[@]}"; do
  echo -e "\n=== PATTERN: $p ===" >> "$OUT_DIR/report.txt"
  grep -RIn --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=out -E "$p" "$ROOT_DIR" || true
done >> "$OUT_DIR/report.txt" 2>&1

echo "\nAttempting formatting and lint fixes (if tools available)..." >> "$OUT_DIR/report.txt"

# Prettier
if command -v pnpm >/dev/null 2>&1 && pnpm -v >/dev/null 2>&1 && pnpm -s exec -- prettier --version >/dev/null 2>&1; then
  echo "Running prettier --write on common source globs..." >> "$OUT_DIR/report.txt"
  pnpm -s exec -- prettier --write "**/*.{ts,tsx,js,jsx,json,md}" >> "$OUT_DIR/report.txt" 2>&1 || true
else
  echo "prettier not available via pnpm; skipping" >> "$OUT_DIR/report.txt"
fi

# ESLint --fix
if command -v pnpm >/dev/null 2>&1 && pnpm -v >/dev/null 2>&1 && pnpm -s exec -- eslint -v >/dev/null 2>&1; then
  echo "Running eslint --fix across repo..." >> "$OUT_DIR/report.txt"
  pnpm -s exec -- eslint "**/*.{ts,tsx,js,jsx}" --fix --quiet >> "$OUT_DIR/report.txt" 2>&1 || true
else
  echo "eslint not available via pnpm; skipping" >> "$OUT_DIR/report.txt"
fi

# TypeScript diagnostics
echo "\nRunning TypeScript diagnostics (tsc --noEmit) ..." >> "$OUT_DIR/report.txt"
if command -v pnpm >/dev/null 2>&1 && pnpm -v >/dev/null 2>&1 && pnpm -s exec -- tsc --version >/dev/null 2>&1; then
  pnpm -s exec -- tsc -p tsconfig.base.json --noEmit > "$OUT_DIR/tsc.txt" 2>&1 || true
  echo "(truncated tsc output)" >> "$OUT_DIR/report.txt"
  tail -n 200 "$OUT_DIR/tsc.txt" >> "$OUT_DIR/report.txt" 2>&1 || true
else
  echo "pnpm/tsc not available; skipping tsc diagnostics" >> "$OUT_DIR/report.txt"
fi

echo "\nscan-and-fix completed at $(date)" >> "$OUT_DIR/report.txt"
echo "Results: $OUT_DIR/report.txt"

exit 0
