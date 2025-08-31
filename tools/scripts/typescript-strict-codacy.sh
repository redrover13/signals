#!/bin/bash

# TypeScript Strict Mode Analysis Integration with Codacy
# This script runs the TypeScript analyzer and integrates the results with Codacy

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run the TypeScript analyzer
run_ts_analyzer() {
  echo -e "${BLUE}Running TypeScript strict mode analyzer...${NC}"
  node "${ROOT_DIR}/tools/scripts/typescript-strict-analyzer.js"
}

# Function to check if Codacy CLI is available
check_codacy_cli() {
  if ! command -v codacy-analysis-cli &> /dev/null; then
    echo -e "${YELLOW}Codacy CLI not found. Skipping Codacy integration.${NC}"
    return 1
  fi
  return 0
}

# Function to convert TypeScript issues to Codacy format
convert_to_codacy_format() {
  local issues_file="${ROOT_DIR}/typescript-issues.json"
  local codacy_issues_file="${ROOT_DIR}/codacy-typescript-issues.json"
  
  if [ ! -f "$issues_file" ]; then
    echo -e "${RED}TypeScript issues file not found: ${issues_file}${NC}"
    return 1
  fi
  
  echo -e "${BLUE}Converting TypeScript issues to Codacy format...${NC}"
  
  # Use jq to transform the JSON format (if available)
  if command -v jq &> /dev/null; then
    jq -r 'map({
      filename: .filePath,
      line: .line,
      message: .message,
      patternId: "typescript:strict:" + (.code|tostring),
      level: "Warning"
    })' "$issues_file" > "$codacy_issues_file"
  else
    # Fallback to a simple node script if jq is not available
    node -e "
      const fs = require('fs');
      const issues = JSON.parse(fs.readFileSync('${issues_file}', 'utf8'));
      const codacyIssues = issues.map(issue => ({
        filename: issue.filePath,
        line: issue.line,
        message: issue.message,
        patternId: 'typescript:strict:' + issue.code,
        level: 'Warning'
      }));
      fs.writeFileSync('${codacy_issues_file}', JSON.stringify(codacyIssues, null, 2));
    "
  fi
  
  echo -e "${GREEN}Converted issues saved to: ${codacy_issues_file}${NC}"
  return 0
}

# Function to upload issues to Codacy
upload_to_codacy() {
  local codacy_issues_file="${ROOT_DIR}/codacy-typescript-issues.json"
  
  if [ ! -f "$codacy_issues_file" ]; then
    echo -e "${RED}Codacy issues file not found: ${codacy_issues_file}${NC}"
    return 1
  fi
  
  echo -e "${BLUE}Uploading TypeScript issues to Codacy...${NC}"
  
  # Try to use the Codacy MCP integration if available
  if [ -f "${ROOT_DIR}/.codacy/mcp-runner.sh" ]; then
    echo -e "${BLUE}Using Codacy MCP integration...${NC}"
    bash "${ROOT_DIR}/.codacy/mcp-runner.sh" upload-issues -t typescript -i "$codacy_issues_file"
  else
    # Fall back to direct CLI usage
    echo -e "${BLUE}Using Codacy CLI directly...${NC}"
    codacy-analysis-cli upload -t typescript -i "$codacy_issues_file" --allow-network
  fi
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Successfully uploaded issues to Codacy.${NC}"
  else
    echo -e "${RED}Failed to upload issues to Codacy.${NC}"
    return 1
  fi
  
  return 0
}

# Main function
main() {
  echo -e "${BLUE}Starting TypeScript strict mode analysis with Codacy integration...${NC}"
  
  # Run the TypeScript analyzer
  run_ts_analyzer
  
  # Check if Codacy integration is possible
  if check_codacy_cli; then
    # Convert TypeScript issues to Codacy format
    if convert_to_codacy_format; then
      # Upload issues to Codacy
      upload_to_codacy
    fi
  else
    echo -e "${YELLOW}Skipping Codacy integration. Results are available in ${ROOT_DIR}/typescript-issues.json${NC}"
  fi
  
  echo -e "${GREEN}TypeScript strict mode analysis complete.${NC}"
}

# Run the main function
main "$@"
