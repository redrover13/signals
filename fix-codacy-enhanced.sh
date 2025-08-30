#!/bin/bash

# Enhanced fix for Codacy CLI JSON parsing error
# This addresses "SyntaxError: Unexpected number in JSON at position 21" for both CLI and MCP integration

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Applying enhanced Codacy CLI fix for both CLI and MCP integration...${NC}"

# 1. Set the Codacy CLI version explicitly in the environment
export CODACY_CLI_V2_VERSION="1.0.0-main.354.sha.642d8bf"

# 2. Create a wrapper script that will be used by both CLI and MCP
WRAPPER_SCRIPT=".codacy/cli-wrapper.sh"

cat > "$WRAPPER_SCRIPT" << 'EOL'
#!/bin/bash

# Set the Codacy CLI version explicitly
export CODACY_CLI_V2_VERSION="1.0.0-main.354.sha.642d8bf"

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Call the original CLI script with all arguments
"$SCRIPT_DIR/cli.sh" "$@"
EOL

# Make the wrapper executable
chmod +x "$WRAPPER_SCRIPT"

# 3. Modify the original cli.sh script to improve JSON parsing
CLI_SCRIPT=".codacy/cli.sh"

if [ -f "$CLI_SCRIPT" ]; then
  # Create a backup of the original script
  cp "$CLI_SCRIPT" "${CLI_SCRIPT}.bak"
  
  # Update the get_latest_version function to use a more robust method
  sed -i '/get_latest_version()/,/^}/c\
get_latest_version() {\
    # If CODACY_CLI_V2_VERSION is set, use that instead of querying GitHub\
    if [ -n "$CODACY_CLI_V2_VERSION" ]; then\
        echo "$CODACY_CLI_V2_VERSION"\
        return 0\
    fi\
\
    local response\
    if [ -n "$GH_TOKEN" ]; then\
        response=$(curl -Lq --header "Authorization: Bearer $GH_TOKEN" "https://api.github.com/repos/codacy/codacy-cli-v2/releases/latest" 2>/dev/null)\
    else\
        response=$(curl -Lq "https://api.github.com/repos/codacy/codacy-cli-v2/releases/latest" 2>/dev/null)\
    fi\
\
    handle_rate_limit "$response"\
\
    # Use a more robust method to extract the tag_name value\
    local version=$(echo "$response" | grep -o "\"tag_name\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | head -1 | cut -d\\" -f4)\
    if [ -z "$version" ]; then\
        # Fallback to a known working version if parsing fails\
        version="1.0.0-main.354.sha.642d8bf"\
        echo "Warning: Could not parse GitHub API response, using fallback version: $version" >&2\
    fi\
    echo "$version"\
}' "$CLI_SCRIPT"

  echo -e "${GREEN}Updated CLI script with robust JSON parsing.${NC}"
else
  echo -e "${RED}Could not find Codacy CLI script at $CLI_SCRIPT${NC}"
fi

# 4. Create a persistent environment variable setting for the Codacy CLI version
# This ensures the version is set for all future shells, including those used by VS Code

# Add to .bashrc if it exists
if [ -f "$HOME/.bashrc" ]; then
  if ! grep -q "CODACY_CLI_V2_VERSION=" "$HOME/.bashrc"; then
    echo '# Fix for Codacy CLI JSON parsing error' >> "$HOME/.bashrc"
    echo 'export CODACY_CLI_V2_VERSION="1.0.0-main.354.sha.642d8bf"' >> "$HOME/.bashrc"
    echo -e "${GREEN}Added Codacy CLI version to .bashrc${NC}"
  fi
fi

# Create .env file for the MCP server to use
cat > ".codacy/.env" << 'EOL'
CODACY_CLI_V2_VERSION="1.0.0-main.354.sha.642d8bf"
EOL

echo -e "${GREEN}Created .env file for MCP server integration${NC}"

# 5. Create a modified MCP configuration 
cat > ".codacy/mcp-config.json" << 'EOL'
{
  "cli": {
    "wrapper": "./cli-wrapper.sh",
    "env": {
      "CODACY_CLI_V2_VERSION": "1.0.0-main.354.sha.642d8bf"
    }
  }
}
EOL

echo -e "${GREEN}Created MCP configuration file${NC}"

echo -e "${YELLOW}Testing the fix...${NC}"

# 6. Test the wrapper script
./.codacy/cli-wrapper.sh analyze --format sarif --output "codacy-test-wrapper.sarif" ./package.json

# Check if the test was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Success! Wrapper script is working.${NC}"
else
  echo -e "${RED}Error with wrapper script. Please check the output above.${NC}"
fi

echo -e "${YELLOW}Fix complete. Please restart VS Code for MCP integration changes to take effect.${NC}"
echo -e "${YELLOW}If you continue to experience issues with the MCP server integration, you may need to reset the MCP server connection in VS Code.${NC}"
