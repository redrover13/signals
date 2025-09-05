#!/usr/bin/env node

/**
 * Test script to verify PR-Agent MCP server functionality
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory equivalent to __dirname in CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the PR-Agent MCP server script
const serverPath = path.join(__dirname, '.mcp', 'servers', 'pr-agent-mcp-server.mjs');

// Sample request for PR describe
const sampleRequest = {
  method: 'pr_describe',
  params: {
    owner: 'redrover13',
    repo: 'signals',
    pr_number: 123
  }
};

console.log('Testing PR-Agent MCP server...');
console.log(`Server path: ${serverPath}`);
console.log(`Sample request: ${JSON.stringify(sampleRequest, null, 2)}`);

// Spawn the PR-Agent MCP server
const serverProcess = spawn('node', [serverPath], {
  env: {
    ...process.env,
    OPENAI_KEY: 'test-openai-key',
    GITHUB_TOKEN: 'test-github-token',
    DEBUG: 'true'
  }
});

// Create readline interface to parse server output
const rl = readline.createInterface({
  input: serverProcess.stdout,
  terminal: false
});

// Listen for server output
rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    console.log('Received response:');
    console.log(JSON.stringify(response, null, 2));
    
    // Exit the test after receiving a response
    setTimeout(() => {
      console.log('Test completed. Exiting...');
      serverProcess.kill();
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error(`Error parsing response: ${error.message}`);
    console.log(`Raw response: ${line}`);
  }
});

// Listen for server errors
serverProcess.stderr.on('data', (data) => {
  console.error(`Server error: ${data.toString()}`);
});

// Send the sample request to the server
setTimeout(() => {
  console.log('Sending sample request...');
  serverProcess.stdin.write(JSON.stringify(sampleRequest) + '\n');
}, 1000);

// Handle test timeout
setTimeout(() => {
  console.error('Test timed out after 10 seconds. Exiting...');
  serverProcess.kill();
  process.exit(1);
}, 10000);
