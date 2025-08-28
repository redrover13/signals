#!/bin/bash
# Script to standardize pnpm setup across all GitHub workflows

# Define the standardized pnpm setup steps
standardize_pnpm_setup() {
  local file=$1
  echo "Standardizing pnpm setup in $file..."
  
  # Find the setup-node step and add pnpm caching
  if grep -q "actions/setup-node@" "$file"; then
    # Check if pnpm caching is already set up
    if ! grep -q "setup-pnpm-cache" "$file"; then
      # Create a temporary file with the modification
      awk '
        /uses: actions\/setup-node@/,/}/ {
          print
          if ($0 ~ /}/) {
            print ""
            print "      - name: Setup pnpm cache"
            print "        uses: actions/cache@13aacd865c20de90d75de3b17b4d668cea53b85f # v4.0.0"
            print "        with:"
            print "          path: |"
            print "            ${{ env.STORE_PATH }}"
            print "          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('\''**/pnpm-lock.yaml'\'') }}"
            print "          restore-keys: |"
            print "            ${{ runner.os }}-pnpm-store-"
          }
          next
        }
        { print }
      ' "$file" > temp_file && mv temp_file "$file"
    fi
    
    # Check if STORE_PATH is already defined
    if ! grep -q "STORE_PATH:" "$file"; then
      # Create a temporary file with the modification
      awk '
        /runs-on:/ {
          print $0
          print "    env:"
          print "      STORE_PATH: $(pnpm store path)"
          next
        }
        { print }
      ' "$file" > temp_file && mv temp_file "$file"
    fi
    
    # Ensure pnpm install command is standardized
    if grep -q "run:" "$file" && grep -q "pnpm install" "$file"; then
      # Don't add --frozen-lockfile if it's already there
      grep -q "pnpm install --frozen-lockfile" "$file" || sed -i 's/pnpm install/pnpm install --frozen-lockfile/g' "$file"
    fi
  fi
  
  echo "✅ Standardized pnpm setup in $file"
}

# Update all workflow files
for file in .github/workflows/*.yml; do
  standardize_pnpm_setup "$file"
done

echo "All workflow files have been standardized for pnpm setup!"
