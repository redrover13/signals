#!/usr/bin/env node

import { spawn } from 'child_process';

const testRequest = {
  method: 'pr_review',
  params: {
    owner: 'redrover13',
    repo: 'signals',
    pr_number: '1'
  }
};

// Start the MCP server
const serverProcess = spawn('node', ['.mcp/servers/pr-agent-mcp-server.mjs'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverOutput = '';
let serverError = '';

serverProcess.stdout.on('data', (data) => {
  serverOutput += data.toString();
  console.log('Server output:', data.toString());
});

serverProcess.stderr.on('data', (data) => {
  serverError += data.toString();
  console.error('Server error:', data.toString());
});

// Wait a moment for server to start
setTimeout(() => {
  // Send test request
  serverProcess.stdin.write(JSON.stringify(testRequest) + '\n');

  // Wait for response
  setTimeout(() => {
    console.log('Test completed');
    console.log('Output:', serverOutput);
    console.log('Error:', serverError);
    serverProcess.kill();
    process.exit(0);
  }, 10000); // Wait 10 seconds for response
}, 2000);
