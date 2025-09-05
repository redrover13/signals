#!/bin/bash

# Setup script for PR-Agent MCP integration
echo "🤖 Setting up PR-Agent MCP integration..."

# Create .pr_agent.toml configuration file if it doesn't exist
if [[ ! -f ".pr_agent.toml" ]]; then
    echo "Creating PR-Agent configuration file..."
    cat > ".pr_agent.toml" << 'EOF'
[pr_description]
enabled = true
minimal_description_length = 50

[review]
enabled = true
require_all_checks_to_pass = false
require_tests_for_modified_code = true
require_descriptive_title = true
require_linked_issues = false

[review.pr_allowed_to_fail_checks]
required_approvals = 1

[improve]
enabled = true
check_all_commits = true
generate_extra_reviewers = false

[improve.incremental]
enabled = true
max_incremental_reviews = 3

[security]
enabled = true
check_all_commits = true

[label]
enabled = true
apply_labels = true
remove_labels = true

[variables]
language = "TypeScript, JavaScript"
framework = "Node.js"
company_name = "Dulce de Saigon"
product_description = "F&B Data Platform for the Vietnamese market"
compliance_requirements = "Vietnamese data privacy laws"
EOF
    echo "✅ PR-Agent configuration file created"
else
    echo "✅ PR-Agent configuration file already exists"
fi

# Create the PR-Agent MCP server script if it doesn't exist
if [[ ! -f ".mcp/servers/pr-agent-mcp-server.mjs" ]]; then
    mkdir -p ".mcp/servers"
    echo "Creating PR-Agent MCP server script..."
    cat > ".mcp/servers/pr-agent-mcp-server.mjs" << 'EOF'
#!/usr/bin/env node
/**
 * PR-Agent MCP Server
 * 
 * This is a simple MCP server that proxies requests to PR-Agent CLI
 * This is useful when PR-Agent MCP package is not available
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory equivalent to __dirname in CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEBUG = false;

// Set up logging
const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}
const LOG_FILE = path.join(LOG_DIR, 'pr-agent-mcp.log');

function log(message) {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
  }
}

// Create interface to read from stdin
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Handle incoming MCP requests
rl.on('line', (line) => {
  try {
    const request = JSON.parse(line);
    log(`Received request: ${JSON.stringify(request)}`);
    
    // Process the request
    handleRequest(request);
  } catch (error) {
    log(`Error processing request: ${error.message}`);
    sendResponse({
      error: `Failed to process request: ${error.message}`
    });
  }
});

// Handle MCP requests
async function handleRequest(request) {
  if (request.method === 'pr_review') {
    await handlePrReview(request);
  } else if (request.method === 'pr_describe') {
    await handlePrDescribe(request);
  } else if (request.method === 'pr_improve') {
    await handlePrImprove(request);
  } else if (request.method === 'pr_ask') {
    await handlePrAsk(request);
  } else if (request.method === 'pr_compliance') {
    await handlePrCompliance(request);
  } else {
    sendResponse({
      error: `Unknown method: ${request.method}`
    });
  }
}

// Handle PR review
async function handlePrReview(request) {
  const { owner, repo, pr_number } = request.params;
  
  log(`Reviewing PR ${owner}/${repo}#${pr_number}`);
  
  // Execute PR-Agent CLI command
  const args = [
    'dlx',
    '@codium-ai/pr-agent',
    'review',
    '--github_pr',
    `${owner}/${repo}/${pr_number}`
  ];
  
  await executePrAgentCommand(args);
}

// Handle PR describe
async function handlePrDescribe(request) {
  const { owner, repo, pr_number } = request.params;
  
  log(`Describing PR ${owner}/${repo}#${pr_number}`);
  
  // Execute PR-Agent CLI command
  const args = [
    'dlx',
    '@codium-ai/pr-agent',
    'describe',
    '--github_pr',
    `${owner}/${repo}/${pr_number}`
  ];
  
  await executePrAgentCommand(args);
}

// Handle PR improve
async function handlePrImprove(request) {
  const { owner, repo, pr_number } = request.params;
  
  log(`Improving PR ${owner}/${repo}#${pr_number}`);
  
  // Execute PR-Agent CLI command
  const args = [
    'dlx',
    '@codium-ai/pr-agent',
    'improve',
    '--github_pr',
    `${owner}/${repo}/${pr_number}`
  ];
  
  await executePrAgentCommand(args);
}

// Handle PR ask
async function handlePrAsk(request) {
  const { owner, repo, pr_number, question } = request.params;
  
  log(`Asking PR ${owner}/${repo}#${pr_number}: ${question}`);
  
  // Execute PR-Agent CLI command
  const args = [
    'dlx',
    '@codium-ai/pr-agent',
    'ask',
    '--github_pr',
    `${owner}/${repo}/${pr_number}`,
    '--question',
    question
  ];
  
  await executePrAgentCommand(args);
}

// Handle PR compliance
async function handlePrCompliance(request) {
  const { owner, repo, pr_number } = request.params;
  
  log(`Checking compliance for PR ${owner}/${repo}#${pr_number}`);
  
  // Execute PR-Agent CLI command
  const args = [
    'dlx',
    '@codium-ai/pr-agent',
    'compliance',
    '--github_pr',
    `${owner}/${repo}/${pr_number}`
  ];
  
  await executePrAgentCommand(args);
}

// Execute PR-Agent command
async function executePrAgentCommand(args) {
  log(`Executing pnpm ${args.join(' ')}`);
  
  // Create environment variables for the process
  const env = {
    ...process.env,
    OPENAI_KEY: process.env.OPENAI_KEY || '',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || ''
  };
  
  // Spawn the process
  const childProcess = spawn('pnpm', args, { env });
  
  let output = '';
  let error = '';
  
  childProcess.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  childProcess.stderr.on('data', (data) => {
    error += data.toString();
  });
  
  childProcess.on('close', (code) => {
    log(`Process exited with code ${code}`);
    
    if (code === 0) {
      sendResponse({
        result: {
          output,
          success: true
        }
      });
    } else {
      sendResponse({
        error: `PR-Agent command failed with code ${code}: ${error}`
      });
    }
  });
}

// Send response back to MCP
function sendResponse(response) {
  log(`Sending response: ${JSON.stringify(response)}`);
  console.log(JSON.stringify(response));
}

// Log startup
log('PR-Agent MCP Server started');
EOF

    # Make the script executable
    chmod +x ".mcp/servers/pr-agent-mcp-server.mjs"
    echo "✅ Created PR-Agent MCP server script"
else
    echo "✅ PR-Agent MCP server script already exists"
fi

# Update MCP configuration files if they exist
if [[ -d ".mcp/config" ]]; then
    # Check if enhanced-mcp.json exists
    if [[ -f ".mcp/config/enhanced-mcp.json" ]]; then
        # Check if PR-Agent is already configured correctly
        if ! grep -q "pr-agent-mcp-server.mjs" ".mcp/config/enhanced-mcp.json"; then
            echo "Updating PR-Agent in enhanced-mcp.json..."
            # Create a temporary file
            TEMP_FILE=$(mktemp)
            
            # Use jq to update PR-Agent in the servers section
            cat ".mcp/config/enhanced-mcp.json" | \
            jq '.servers["pr-agent"] = {
                "command": "node",
                "args": ["'"$PWD"'/.mcp/servers/pr-agent-mcp-server.mjs"],
                "env": {
                    "OPENAI_KEY": "openai-key",
                    "GITHUB_TOKEN": "github-token"
                }
            }' > "$TEMP_FILE"
            
            # Replace the original file
            mv "$TEMP_FILE" ".mcp/config/enhanced-mcp.json"
            echo "✅ Updated PR-Agent in enhanced-mcp.json"
        else
            echo "✅ PR-Agent correctly configured in enhanced-mcp.json"
        fi
    fi
    
    # Check if mcp.json exists
    if [[ -f ".mcp/config/mcp.json" ]]; then
        # Check if PR-Agent is already configured correctly
        if ! grep -q "pr-agent-mcp-server.mjs" ".mcp/config/mcp.json"; then
            echo "Updating PR-Agent in mcp.json..."
            # Create a temporary file
            TEMP_FILE=$(mktemp)
            
            # Use jq to update PR-Agent in the servers section
            cat ".mcp/config/mcp.json" | \
            jq '.servers["pr-agent"] = {
                "command": "node",
                "args": ["'"$PWD"'/.mcp/servers/pr-agent-mcp-server.mjs"],
                "type": "stdio",
                "env": {
                    "OPENAI_KEY": "openai-key",
                    "GITHUB_TOKEN": "github-token"
                }
            }' > "$TEMP_FILE"
            
            # Replace the original file
            mv "$TEMP_FILE" ".mcp/config/mcp.json"
            echo "✅ Updated PR-Agent in mcp.json"
        else
            echo "✅ PR-Agent correctly configured in mcp.json"
        fi
    fi
fi

echo "PR-Agent MCP integration setup complete."
echo "NOTE: Make sure to set the OPENAI_KEY secret in your GitHub repository."
# Create PR-Agent GitHub workflow if it doesn't exist
if [[ ! -f ".github/workflows/pr_agent.yml" ]]; then
    mkdir -p ".github/workflows"
    echo "Creating PR-Agent workflow..."
    cat > ".github/workflows/pr_agent.yml" << 'EOF'
name: PR-Agent

on:
  pull_request:
    types: [opened, reopened, synchronize, ready_for_review]
  issue_comment:
    types: [created, edited]

jobs:
  pr_agent_job:
    runs-on: ubuntu-latest
    if: ${{ github.event.pull_request || contains(github.event.comment.body, '/pr-agent') }}
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2.2.2
        with:
          version: 8.6.0
          run_install: false
          
      - name: Get pnpm store directory
        id: pnpm-cache
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

      - name: Setup pnpm cache
        uses: actions/cache@v4
        with:
          path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-
            
      - name: Install dependencies
        run: pnpm install
          
      - name: PR Agent Action
        uses: Codium-ai/pr-agent@v0.11
        env:
          OPENAI_KEY: ${{ secrets.OPENAI_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
EOF
    echo "✅ PR-Agent workflow created"
else
    echo "✅ PR-Agent workflow already exists"
fi

echo "✅ PR-Agent MCP integration setup complete"
