#!/bin/bash

# Script to fix Codacy CLI JSON parsing error
# This addresses "SyntaxError: Unexpected number in JSON at position 21"

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Fixing Codacy CLI JSON parsing error...${NC}"

# 1. Set the Codacy CLI version explicitly to bypass GitHub API parsing
export CODACY_CLI_V2_VERSION="1.0.0-main.354.sha.642d8bf"

# 2. Modify the get_latest_version function in cli.sh to handle the JSON format properly
# This is a backup solution in case setting the version doesn't work
CLI_SCRIPT=".codacy/cli.sh"

if [ -f "$CLI_SCRIPT" ]; then
  # Create a backup of the original script
  cp "$CLI_SCRIPT" "${CLI_SCRIPT}.bak"
  
  # Update the get_latest_version function to use jq if available
  # This provides more robust JSON parsing
  sed -i '/get_latest_version()/,/^}/c\
get_latest_version() {\
    local response\
    if [ -n "$GH_TOKEN" ]; then\
        response=$(curl -Lq --header "Authorization: Bearer $GH_TOKEN" "https://api.github.com/repos/codacy/codacy-cli-v2/releases/latest" 2>/dev/null)\
    else\
        response=$(curl -Lq "https://api.github.com/repos/codacy/codacy-cli-v2/releases/latest" 2>/dev/null)\
    fi\
\
    handle_rate_limit "$response"\
\
    # Try using jq for more robust parsing if available\
    if command -v jq > /dev/null 2>&1; then\
        local version=$(echo "$response" | jq -r .tag_name 2>/dev/null)\
        if [ -n "$version" ] && [ "$version" != "null" ]; then\
            echo "$version"\
            return 0\
        fi\
    fi\
\
    # Fallback to grep/cut method\
    local version=$(echo "$response" | grep -m 1 "\"tag_name\":" | sed -E '"'"'s/.*"tag_name"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/'"'"')\
    echo "$version"\
}' "$CLI_SCRIPT"

  echo -e "${GREEN}Updated CLI script to handle JSON parsing more robustly.${NC}"
else
  echo -e "${RED}Could not find Codacy CLI script at $CLI_SCRIPT${NC}"
fi

# 3. Test if jq is installed, install it if needed
if ! command -v jq > /dev/null 2>&1; then
  echo -e "${YELLOW}Installing jq for better JSON parsing...${NC}"
  sudo apt-get update && sudo apt-get install -y jq
fi

echo -e "${GREEN}Fix applied! Now running a test analysis...${NC}"

# 4. Run a test analysis
./.codacy/cli.sh analyze --format sarif --output "codacy-test.sarif" ./.codacy.yml

# Check if the analysis was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Success! Codacy CLI is now working properly.${NC}"
else
  echo -e "${RED}Error still persists. Please check the output above for details.${NC}"
  echo -e "${YELLOW}You can try running: export CODACY_CLI_V2_VERSION=\"1.0.0-main.354.sha.642d8bf\" before using the CLI.${NC}"
fi
