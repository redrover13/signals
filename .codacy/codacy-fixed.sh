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
