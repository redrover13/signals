#!/bin/bash

# Codacy CLI integration with PNPM
# This script uses PNPM to manage dependencies and run Codacy CLI commands

set -e

# Define variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
CONFIG_FILE="$SCRIPT_DIR/codacy.yaml"
VERSION="1.0.0-main.354.sha.642d8bf"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Helper function for logging
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/codacy-pnpm.log"
}

# Function to install Codacy CLI locally
install_cli() {
  log "Installing Codacy CLI version $VERSION with PNPM..."
  
  # Create a temporary package.json if it doesn't exist
  if [ ! -f "$SCRIPT_DIR/package.json" ]; then
    cat > "$SCRIPT_DIR/package.json" << EOF
{
  "name": "codacy-cli-wrapper",
  "version": "1.0.0",
  "private": true,
  "dependencies": {}
}
EOF
  fi
  
  # Download the Codacy CLI binary
  DOWNLOAD_URL="https://github.com/codacy/codacy-cli-v2/releases/download/$VERSION/codacy-cli-v2_${VERSION}_linux_amd64.tar.gz"
  DOWNLOAD_DIR="$SCRIPT_DIR/bin"
  mkdir -p "$DOWNLOAD_DIR"
  
  log "Downloading from $DOWNLOAD_URL to $DOWNLOAD_DIR"
  curl -L -s "$DOWNLOAD_URL" | tar -xz -C "$DOWNLOAD_DIR"
  
  log "Codacy CLI installed successfully at $DOWNLOAD_DIR/codacy-cli-v2"
  chmod +x "$DOWNLOAD_DIR/codacy-cli-v2"
}

# Function to run Codacy analysis using PNPM
run_analysis() {
  local file_path="$1"
  local tool="$2"
  local format="$3"
  
  if [ ! -f "$SCRIPT_DIR/bin/codacy-cli-v2" ]; then
    install_cli
  fi
  
  CMD="$SCRIPT_DIR/bin/codacy-cli-v2"
  
  if [ -n "$file_path" ]; then
    log "Running analysis on file: $file_path"
    if [ -n "$tool" ]; then
      log "Using specific tool: $tool"
      $CMD analyze "$file_path" --tool "$tool" --format "$format"
    else
      $CMD analyze "$file_path" --format "$format"
    fi
  else
    log "Running analysis on entire project"
    if [ -n "$tool" ]; then
      log "Using specific tool: $tool"
      $CMD analyze --tool "$tool" --format "$format"
    else
      $CMD analyze --format "$format"
    fi
  fi
}

# Function to initialize Codacy configuration
init_codacy() {
  if [ ! -f "$SCRIPT_DIR/bin/codacy-cli-v2" ]; then
    install_cli
  fi
  
  log "Initializing Codacy configuration"
  $SCRIPT_DIR/bin/codacy-cli-v2 init
}

# Function to install required tools
install_tools() {
  if [ ! -f "$SCRIPT_DIR/bin/codacy-cli-v2" ]; then
    install_cli
  fi
  
  log "Installing required tools from configuration"
  $SCRIPT_DIR/bin/codacy-cli-v2 install
}

# Main execution logic
case "$1" in
  "init")
    init_codacy
    ;;
  "install")
    install_tools
    ;;
  "analyze")
    shift
    file_path=""
    tool=""
    format="sarif"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --tool)
          tool="$2"
          shift 2
          ;;
        --format)
          format="$2"
          shift 2
          ;;
        *)
          file_path="$1"
          shift
          ;;
      esac
    done
    
    run_analysis "$file_path" "$tool" "$format"
    ;;
  *)
    echo "Usage: $0 {init|install|analyze} [file_path] [--tool tool_name] [--format format_type]"
    echo ""
    echo "Commands:"
    echo "  init                Initialize Codacy configuration"
    echo "  install             Install required tools"
    echo "  analyze [file]      Run analysis on the specified file or entire project"
    echo ""
    echo "Options:"
    echo "  --tool TOOL         Specify a particular tool to use for analysis"
    echo "  --format FORMAT     Output format (default: sarif)"
    exit 1
    ;;
esac

log "Command completed successfully"
exit 0
