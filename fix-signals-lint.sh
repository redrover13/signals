#!/bin/bash

# Navigate to the project root
cd /home/g_nelson/signals-1

# Run lint with autofix option
pnpm nx run signals:lint --fix

# Show any remaining issues
pnpm nx run signals:lint
