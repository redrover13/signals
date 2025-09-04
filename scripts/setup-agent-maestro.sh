#!/bin/bash

# Setup script for Agent Maestro environment variables
# This script helps you set up the required environment variables for Agent Maestro

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Agent Maestro Setup ===${NC}"
echo -e "This script will help you set up environment variables for Agent Maestro.\n"

# Check if .env.local exists
ENV_FILE=".env.local"
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${BLUE}Creating ${ENV_FILE} file...${NC}"
  touch "$ENV_FILE"
else
  echo -e "${BLUE}Updating existing ${ENV_FILE} file...${NC}"
fi

# Function to prompt for a token
get_token() {
  local token_name=$1
  local env_var=$2
  local existing_value=""
  
  if grep -q "^$env_var=" "$ENV_FILE"; then
    existing_value=$(grep "^$env_var=" "$ENV_FILE" | cut -d '=' -f2)
    echo -e "${BLUE}Existing $token_name found.${NC}"
    read -p "Would you like to update it? (y/n) [n]: " update
    update=${update:-n}
    
    if [[ $update != "y" ]]; then
      echo -e "${GREEN}Keeping existing $token_name.${NC}"
      return
    fi
  fi
  
  echo -e "${BLUE}Please enter your $token_name:${NC}"
  read -s token
  
  if [[ -z "$token" ]]; then
    echo -e "${RED}No token provided. Skipping...${NC}"
    return
  fi
  
  # Update or add the token to .env.local
  if grep -q "^$env_var=" "$ENV_FILE"; then
    sed -i "s/^$env_var=.*/$env_var=$token/" "$ENV_FILE"
  else
    echo "$env_var=$token" >> "$ENV_FILE"
  fi
  
  echo -e "${GREEN}$token_name has been added to $ENV_FILE${NC}"
}

# GitHub Personal Access Token
echo -e "\n${BLUE}GitHub Personal Access Token${NC}"
echo "This token is used to connect Agent Maestro to GitHub MCP Server."
echo "You need a token with repo, workflow, and read:user scopes."
echo "Generate one at https://github.com/settings/tokens"
get_token "GitHub Personal Access Token" "GITHUB_PERSONAL_ACCESS_TOKEN"

# Codacy API Token
echo -e "\n${BLUE}Codacy API Token${NC}"
echo "This token is used to connect Agent Maestro to Codacy MCP Server."
echo "Generate one in your Codacy account settings."
get_token "Codacy API Token" "CODACY_API_TOKEN"

# Anthropic API Key (optional)
echo -e "\n${BLUE}Anthropic API Key (optional)${NC}"
echo "This key is used to connect Agent Maestro to Anthropic Claude."
echo "It's optional but recommended for better code generation."
echo "Get one at https://console.anthropic.com"
get_token "Anthropic API Key" "ANTHROPIC_API_KEY"

echo -e "\n${GREEN}Setup complete!${NC}"
echo -e "Environment variables have been saved to $ENV_FILE"
echo -e "Restart VS Code for the changes to take effect."
echo -e "See docs/AGENT_MAESTRO.md for usage instructions."
