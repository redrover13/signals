#!/bin/bash

# Fix GitHub Workflows - Comprehensive Workflow Repair Script
# This script fixes common issues in GitHub workflows including:
# 1. pnpm setup ordering issues
# 2. Missing pnpm store path configuration
# 3. Version inconsistencies
# 4. Cache configuration problems

set -e

echo "🔧 Starting GitHub Workflows Repair..."

# Define consistent versions
PNPM_VERSION="8.6.0"  # Downgraded to ensure compatibility
NODE_VERSION="20"
PNPM_ACTION_VERSION="v2.2.2"  # Changed to v2 to ensure availability

# Backup directory
BACKUP_DIR=".github/workflows/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Creating backup in $BACKUP_DIR..."

# Function to backup and fix a workflow file
fix_workflow() {
    local file="$1"
    local filename=$(basename "$file")
    
    echo "🔄 Processing $filename..."
    
    # Create backup
    cp "$file" "$BACKUP_DIR/$filename"
    
    # Create temporary file for processing
    local temp_file=$(mktemp)
    
    # Fix the workflow using a comprehensive sed script
    cat "$file" | \
    # Fix pnpm action version consistency
    sed 's/pnpm\/action-setup@v[0-9]\+\(\.[0-9]\+\)\?\(\.[0-9]\+\)\?/pnpm\/action-setup@'"$PNPM_ACTION_VERSION"'/g' | \
    # Fix pnpm version consistency
    sed 's/version: [0-9]\+\(\.[0-9]\+\)\?\(\.[0-9]\+\)\?$/version: '"$PNPM_VERSION"'/g' | \
    # Remove cache: 'pnpm' from setup-node when it appears before pnpm setup
    awk '
    BEGIN { 
        in_setup_node = 0
        pnpm_setup_found = 0
        buffer = ""
        line_count = 0
    }
    
    # Track if we have seen pnpm setup
    /uses: pnpm\/action-setup/ { pnpm_setup_found = 1 }
    
    # Track setup-node blocks
    /uses: actions\/setup-node/ { 
        in_setup_node = 1
        print $0
        next
    }
    
    # Handle setup-node with block
    in_setup_node && /with:/ {
        print $0
        next
    }
    
    # Handle cache line in setup-node
    in_setup_node && /cache:.*pnpm/ {
        if (pnpm_setup_found == 0) {
            # Skip this line if pnpm setup hasnt been seen yet
            print "          # cache: pnpm # Removed - pnpm not installed yet"
        } else {
            print $0
        }
        next
    }
    
    # End of setup-node block
    in_setup_node && !/^[ \t]/ && !/^$/ {
        in_setup_node = 0
        print $0
        next
    }
    
    # Default: print the line
    { print $0 }
    ' > "$temp_file"
    
    # Apply the processed content back to the file
    mv "$temp_file" "$file"
    
    echo "✅ Fixed $filename"
}

# Function to add proper pnpm setup structure to workflows that need it
add_proper_pnpm_setup() {
    local file="$1"
    local filename=$(basename "$file")
    
    # Check if file has setup-node with pnpm cache but no pnpm setup
    if grep -q "cache:.*pnpm" "$file" && ! grep -q "pnpm/action-setup" "$file"; then
        echo "🔧 Adding pnpm setup to $filename..."
        
        # Create a temporary file with proper pnpm setup
        local temp_file=$(mktemp)
        
        awk '
        /uses: actions\/setup-node/ {
            # Insert pnpm setup before setup-node
            print "      - name: Setup pnpm"
            print "        uses: pnpm/action-setup@'"$PNPM_ACTION_VERSION"'"
            print "        with:"
            print "          version: '"$PNPM_VERSION"'"
            print "          run_install: false"
            print ""
            print $0
            next
        }
        { print $0 }
        ' "$file" > "$temp_file"
        
        mv "$temp_file" "$file"
        echo "✅ Added pnpm setup to $filename"
    fi
}

# Function to add pnpm store path configuration where missing
add_pnpm_store_config() {
    local file="$1"
    local filename=$(basename "$file")
    
    # Check if file uses pnpm but doesn't have store path configuration
    if grep -q "pnpm install" "$file" && ! grep -q "pnpm store path" "$file" && ! grep -q "STORE_PATH" "$file"; then
        echo "🔧 Adding pnpm store configuration to $filename..."
        
        local temp_file=$(mktemp)
        
        awk '
        /pnpm install/ {
            # Insert pnpm store configuration before pnpm install
            print "      - name: Get pnpm store directory"
            print "        id: pnpm-cache"
            print "        shell: bash"
            print "        run: |"
            print "          echo \"STORE_PATH=\$(pnpm store path)\" >> \$GITHUB_OUTPUT"
            print ""
            print "      - name: Setup pnpm cache"
            print "        uses: actions/cache@v4"
            print "        with:"
            print "          path: \${{ steps.pnpm-cache.outputs.STORE_PATH }}"
            print "          key: \${{ runner.os }}-pnpm-store-\${{ hashFiles('\'**/pnpm-lock.yaml\'') }}"
            print "          restore-keys: |"
            print "            \${{ runner.os }}-pnpm-store-"
            print ""
            print $0
            next
        }
        { print $0 }
        ' "$file" > "$temp_file"
        
        mv "$temp_file" "$file"
        echo "✅ Added pnpm store configuration to $filename"
    fi
}

# Process all workflow files
echo "🔍 Finding workflow files..."
workflow_files=$(find .github/workflows -name "*.yml" -not -path "*/backup-*/*" | grep -v ".bak$")

for file in $workflow_files; do
    if [[ -f "$file" ]]; then
        fix_workflow "$file"
        add_proper_pnpm_setup "$file"
        add_pnpm_store_config "$file"
    fi
done

# Fix the main CI workflow specifically (it had the most obvious issues)
echo "🎯 Applying specific fixes to main CI workflow..."
if [[ -f ".github/workflows/ci-with-codecov.yml" ]]; then
    cat > ".github/workflows/ci-with-codecov.yml" << 'EOF'
name: CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2.2.2
        with:
          version: 8.6.0
          run_install: false
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
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
        run: pnpm install --frozen-lockfile
      
      - name: Lint
        run: pnpm lint:ci
      
      - name: Build
        run: pnpm build
      
      - name: Test with Coverage
        run: pnpm nx run-many --target=test --all --coverage
      
      - name: Create combined coverage report
        run: |
          mkdir -p ./coverage/combined
          npx nyc merge ./coverage ./coverage/combined/coverage.json
          npx nyc report --reporter=lcov --report-dir=./coverage/combined --temp-dir=./coverage/combined
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          directory: ./coverage/combined
          fail_ci_if_error: false
          verbose: true
EOF
    echo "✅ Fixed main CI workflow"
fi

# Validate workflows using GitHub CLI if available
echo "🔍 Validating fixed workflows..."
if command -v gh &> /dev/null; then
    echo "📋 Running workflow validation..."
    for file in $workflow_files; do
        filename=$(basename "$file")
        echo "Validating $filename..."
        # Note: gh workflow validation requires the workflow to be in a repo
        # We'll just check basic YAML syntax instead
        if command -v yamllint &> /dev/null; then
            yamllint "$file" || echo "⚠️  YAML issues in $filename"
        else
            # Basic YAML check using python
            python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null && echo "✅ $filename syntax OK" || echo "❌ $filename has syntax errors"
        fi
    done
else
    echo "ℹ️  GitHub CLI not available, skipping workflow validation"
fi

# Add PR-Agent workflow if not exists
echo "🤖 Setting up PR-Agent..."
if [[ ! -f ".github/workflows/pr_agent.yml" ]]; then
    echo "Creating PR-Agent workflow..."
    cat > ".github/workflows/pr_agent.yml" << 'EOF'
name: PR Agent

on:
  pull_request:
    types: [opened, reopened, synchronize]
  issue_comment:
    types: [created, edited]

permissions:
  contents: read
  pull-requests: write
  issues: write  # Required for adding labels to PRs

jobs:
  pr_agent_job:
    runs-on: ubuntu-latest
    name: Run PR Agent on PR
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup pnpm
        uses: pnpm/action-setup@v2.2.2
        with:
          version: 8.6.0
          run_install: false

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

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

      - name: PR Agent action
        uses: Codium-ai/pr-agent@v0.11
        env:
          OPENAI_KEY: ${{ secrets.OPENAI_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
EOF
    echo "✅ PR-Agent workflow created"
else
    echo "✅ PR-Agent workflow already exists"
fi

# Update MCP configuration for PR-Agent if it exists
if [[ -d ".mcp/config" ]]; then
    echo "Updating MCP configuration for PR-Agent..."
    
    # Create the PR-Agent MCP server script
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
    
    # Check if enhanced-mcp.json exists
    if [[ -f ".mcp/config/enhanced-mcp.json" ]]; then
        # Check if PR-Agent is already configured
        if ! grep -q "pr-agent" ".mcp/config/enhanced-mcp.json"; then
            echo "Adding PR-Agent to enhanced-mcp.json..."
            # Create a temporary file
            TEMP_FILE=$(mktemp)
            
            # Use jq to add PR-Agent to the servers section
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
            echo "✅ Added PR-Agent to enhanced-mcp.json"
        else
            echo "✅ PR-Agent already configured in enhanced-mcp.json"
        fi
    fi
    
    # Check if mcp.json exists
    if [[ -f ".mcp/config/mcp.json" ]]; then
        # Check if PR-Agent is already configured
        if ! grep -q "pr-agent" ".mcp/config/mcp.json"; then
            echo "Adding PR-Agent to mcp.json..."
            # Create a temporary file
            TEMP_FILE=$(mktemp)
            
            # Use jq to add PR-Agent to the servers section
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
            echo "✅ Added PR-Agent to mcp.json"
        else
            echo "✅ PR-Agent already configured in mcp.json"
        fi
    fi
fi

# Create PR-Agent config if not exists
if [[ ! -f ".pr_agent.toml" ]]; then
    echo "Creating PR-Agent configuration..."
    cat > ".pr_agent.toml" << 'EOF'
# PR-Agent Configuration for Dulce de Saigon F&B Data Platform

[general]
verbosity_level = "debug"

[pr_description]
# Create custom descriptions based on PR content
publish_description_as_comment = true
publish_labels = true
add_original_user_description = true
user_description_heading = "## Original Description"

[pr_reviewer]
require_tests_for_new_code = true
require_changelog_for_user_facing_changes = true
review_bat_changes_as_text = true
review_file_extension_to_language = { vue = "javascript", cjs = "javascript", mjs = "javascript" }
enable_review_labels_security = true
enable_review_labels_effort = true
extra_instructions = """
Follow the Dulce de Saigon project guidelines:
- Check for TypeScript strict mode compliance
- Ensure proper error handling for GCP API calls
- Verify compliance with Vietnamese data privacy regulations
- Check for unit tests for new code
- Validate Nx workspace structure is maintained
"""

[pr_code_suggestions]
auto_approve_suggestions = false
extra_instructions = """
Focus on:
- TypeScript strict mode compliance
- Performance optimizations for GCP
- Nx monorepo best practices
- Following Vietnamese compliance requirements
"""

[pr_compliance]
enable_compliance_labels_security = true
enable_user_defined_compliance_labels = true
compliance_requirements = [
  "All new code must have corresponding unit tests",
  "TypeScript strict mode must be enabled for new files",
  "Vietnamese language support must be maintained in user-facing components",
  "Personal data must be properly encrypted and anonymized",
  "GCP service accounts should follow least privilege principle",
  "Dependencies should be checked for security vulnerabilities"
]

[inline_code_suggestions]
num_code_suggestions = 5
EOF
    echo "✅ PR-Agent configuration created"
else
    echo "✅ PR-Agent configuration already exists"
fi

echo ""
echo "🎉 GitHub Workflows Repair Complete!"
echo ""
echo "📊 Summary of changes:"
echo "   - Fixed pnpm setup ordering in workflows"
echo "   - Standardized pnpm version to $PNPM_VERSION"
echo "   - Standardized pnpm action to $PNPM_ACTION_VERSION"
echo "   - Added proper pnpm store path configuration"
echo "   - Fixed cache configuration issues"
echo "   - Added PR-Agent workflow and configuration"
echo ""
echo "📁 Backups saved in: $BACKUP_DIR"
echo ""
echo "🚀 Next steps:"
echo "   1. Review the changes: git diff .github/workflows/"
echo "   2. Test a workflow: gh workflow run ci-with-codecov.yml"
echo "   3. Commit the fixes: git add .github/workflows/ .pr_agent.toml && git commit -m 'fix: repair GitHub workflows and add PR-Agent'"
echo ""