#!/bin/bash

# Enhanced fix for Codacy CLI JSON parsing error - Version 2
# This addresses "SyntaxError: Unexpected number in JSON at position 21" for both CLI and MCP integration

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Applying enhanced Codacy CLI fix for both CLI and MCP integration...${NC}"

# 1. Directly modify the version.yaml file in the cache
CACHE_DIR="/home/g_nelson/.cache/codacy/codacy-cli-v2"
VERSION_FILE="${CACHE_DIR}/version.yaml"

if [ -f "$VERSION_FILE" ]; then
  echo 'version: "1.0.0-main.354.sha.642d8bf"' > "$VERSION_FILE"
  echo -e "${GREEN}Updated cached version file${NC}"
else
  echo -e "${YELLOW}Cache version file not found at $VERSION_FILE${NC}"
fi

# 2. Create a wrapper script that will be used by both CLI and MCP
WRAPPER_SCRIPT=".codacy/cli-wrapper.sh"

cat > "$WRAPPER_SCRIPT" << 'EOF'
#!/bin/bash

# Set the Codacy CLI version explicitly
export CODACY_CLI_V2_VERSION="1.0.0-main.354.sha.642d8bf"

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Call the original CLI script with all arguments
"$SCRIPT_DIR/cli.sh" "$@"
EOF

# Make the wrapper executable
chmod +x "$WRAPPER_SCRIPT"
echo -e "${GREEN}Created CLI wrapper script${NC}"

# 3. Create a simple modification to the original cli.sh script
CLI_SCRIPT=".codacy/cli.sh"

if [ -f "$CLI_SCRIPT" ]; then
  # Create a backup of the original script
  cp "$CLI_SCRIPT" "${CLI_SCRIPT}.bak"
  
  # Add the environment variable at the top of the script
  sed -i '2i\
# Fix for JSON parsing error\
export CODACY_CLI_V2_VERSION="1.0.0-main.354.sha.642d8bf"
' "$CLI_SCRIPT"

  echo -e "${GREEN}Updated CLI script to use fixed version${NC}"
else
  echo -e "${RED}Could not find Codacy CLI script at $CLI_SCRIPT${NC}"
fi

# 4. Create a persistent environment variable setting
if [ -f "$HOME/.bashrc" ]; then
  if ! grep -q "CODACY_CLI_V2_VERSION=" "$HOME/.bashrc"; then
    echo '# Fix for Codacy CLI JSON parsing error' >> "$HOME/.bashrc"
    echo 'export CODACY_CLI_V2_VERSION="1.0.0-main.354.sha.642d8bf"' >> "$HOME/.bashrc"
    echo -e "${GREEN}Added Codacy CLI version to .bashrc${NC}"
  fi
fi

# Create .env file for the MCP server to use
mkdir -p ".codacy" # Ensure directory exists
cat > ".codacy/.env" << 'EOF'
CODACY_CLI_V2_VERSION=1.0.0-main.354.sha.642d8bf
EOF

echo -e "${GREEN}Created .env file for MCP server integration${NC}"

echo -e "${YELLOW}Testing the fix...${NC}"

# 5. Test with the modified cli.sh script directly
./.codacy/cli.sh analyze --format sarif --output "codacy-test-direct.sarif" ./package.json

# Check if the test was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Success! Direct CLI script is working.${NC}"
else
  echo -e "${RED}Error with direct CLI script. Please check the output above.${NC}"
fi

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
