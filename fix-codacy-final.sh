#!/bin/bash

# Final fix for Codacy CLI JSON parsing error
# This addresses "SyntaxError: Unexpected number in JSON at position 21"

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Applying final Codacy CLI fix...${NC}"

# 1. Create a completely new CLI wrapper script that bypasses the GitHub API call
WRAPPER_SCRIPT=".codacy/codacy-fixed.sh"

cat > "$WRAPPER_SCRIPT" << 'EOF'
#!/bin/bash

# This is a fixed version of the Codacy CLI script that bypasses the GitHub API call
# to avoid the "SyntaxError: Unexpected number in JSON at position 21" error

set -e +o pipefail

# Fixed version that we know works
FIXED_VERSION="1.0.0-main.354.sha.642d8bf"

# Set up paths
bin_name="codacy-cli-v2"

# Determine OS-specific paths
os_name=$(uname)
arch=$(uname -m)

case "$arch" in
"x86_64")
  arch="amd64"
  ;;
"x86")
  arch="386"
  ;;
"aarch64"|"arm64")
  arch="arm64"
  ;;
esac

if [ -z "$CODACY_CLI_V2_TMP_FOLDER" ]; then
    if [ "$(uname)" = "Linux" ]; then
        CODACY_CLI_V2_TMP_FOLDER="$HOME/.cache/codacy/codacy-cli-v2"
    elif [ "$(uname)" = "Darwin" ]; then
        CODACY_CLI_V2_TMP_FOLDER="$HOME/Library/Caches/Codacy/codacy-cli-v2"
    else
        CODACY_CLI_V2_TMP_FOLDER=".codacy-cli-v2"
    fi
fi

# Always use our fixed version
version="$FIXED_VERSION"

# Create version file to avoid GitHub API calls in the future
version_file="$CODACY_CLI_V2_TMP_FOLDER/version.yaml"
mkdir -p "$CODACY_CLI_V2_TMP_FOLDER"
echo "version: \"$version\"" > "$version_file"

download_file() {
    local url="$1"

    echo "Downloading from URL: ${url}"
    if command -v curl > /dev/null 2>&1; then
        curl -# -LS "$url" -O
    elif command -v wget > /dev/null 2>&1; then
        wget "$url"
    else
        echo "Error: Could not find curl or wget, please install one."
        exit 1
    fi
}

download() {
    local url="$1"
    local output_folder="$2"

    ( cd "$output_folder" && download_file "$url" )
}

download_cli() {
    # OS name lower case
    suffix=$(echo "$os_name" | tr '[:upper:]' '[:lower:]')

    local bin_folder="$1"
    local bin_path="$2"
    local version="$3"

    if [ ! -f "$bin_path" ]; then
        echo "📥 Downloading CLI version $version..."

        remote_file="codacy-cli-v2_${version}_${suffix}_${arch}.tar.gz"
        url="https://github.com/codacy/codacy-cli-v2/releases/download/${version}/${remote_file}"

        download "$url" "$bin_folder"
        tar xzfv "${bin_folder}/${remote_file}" -C "${bin_folder}"
    fi
}

# Set up version-specific paths
bin_folder="${CODACY_CLI_V2_TMP_FOLDER}/${version}"

mkdir -p "$bin_folder"
bin_path="$bin_folder"/"$bin_name"

# Download the tool if not already installed
download_cli "$bin_folder" "$bin_path" "$version"
chmod +x "$bin_path"

# Run the CLI with all passed arguments
"$bin_path" "$@"
EOF

# Make the wrapper executable
chmod +x "$WRAPPER_SCRIPT"
echo -e "${GREEN}Created fixed Codacy CLI wrapper script${NC}"

# 2. Set the environment variable globally
if [ -f "$HOME/.bashrc" ]; then
  if ! grep -q "CODACY_CLI_V2_VERSION=" "$HOME/.bashrc"; then
    echo '# Fix for Codacy CLI JSON parsing error' >> "$HOME/.bashrc"
    echo 'export CODACY_CLI_V2_VERSION="1.0.0-main.354.sha.642d8bf"' >> "$HOME/.bashrc"
    echo -e "${GREEN}Added Codacy CLI version to .bashrc${NC}"
  fi
fi

# 3. Update version.yaml in the cache directly
CACHE_DIR="/home/g_nelson/.cache/codacy/codacy-cli-v2"
VERSION_FILE="${CACHE_DIR}/version.yaml"

if [ -d "$CACHE_DIR" ]; then
  echo 'version: "1.0.0-main.354.sha.642d8bf"' > "$VERSION_FILE"
  echo -e "${GREEN}Updated cached version file${NC}"
else
  mkdir -p "$CACHE_DIR"
  echo 'version: "1.0.0-main.354.sha.642d8bf"' > "$VERSION_FILE"
  echo -e "${GREEN}Created cached version file${NC}"
fi

# 4. Test the fixed wrapper script
echo -e "${YELLOW}Testing the fixed CLI wrapper...${NC}"
./.codacy/codacy-fixed.sh analyze --format sarif --output "codacy-test-fixed.sarif" ./package.json

# Check if the test was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Success! Fixed CLI wrapper is working correctly.${NC}"
else
  echo -e "${RED}Error with fixed CLI wrapper. Please check the output above.${NC}"
fi

# 5. Create a simple shell script for MCP to use
cat > ".codacy/mcp-runner.sh" << 'EOF'
#!/bin/bash
# This script is used by the Codacy MCP server
export CODACY_CLI_V2_VERSION="1.0.0-main.354.sha.642d8bf"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/codacy-fixed.sh" "$@"
EOF

chmod +x ".codacy/mcp-runner.sh"
echo -e "${GREEN}Created MCP runner script${NC}"

echo -e "${YELLOW}Fix complete. To use the fixed version:${NC}"
echo -e "${GREEN}1. Run commands with: ./.codacy/codacy-fixed.sh${NC}"
echo -e "${GREEN}2. For MCP integration, run: ./.codacy/mcp-runner.sh${NC}"
echo -e "${YELLOW}Please restart VS Code for changes to take effect.${NC}"
