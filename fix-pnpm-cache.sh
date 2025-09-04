#!/bin/bash

# Fix the UTF-8 Encoding Validation job in pr-validation.yml
sed -i '/encoding-validation:/,/STORE_PATH: '"'"'"'/ s/STORE_PATH: '"'"'"'/STORE_PATH: '"'"'"''"'"'"'/' .github/workflows/pr-validation.yml
sed -i '/encoding-validation:/,/path: |/ s/path: |/path: ${{ env.STORE_PATH }}/' .github/workflows/pr-validation.yml
sed -i '/encoding-validation:/,/name: Setup pnpm cache/a\      - name: Get pnpm store directory\n        shell: bash\n        run: |\n          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV' .github/workflows/pr-validation.yml

# Commit and push the changes
git config --global user.email "github-actions@example.com"
git config --global user.name "GitHub Actions"
git add .github/workflows/pr-validation.yml
git commit -m "fix: update pnpm cache configuration in UTF-8 encoding validation workflow"
git push origin merge-integration-remote
