#!/usr/bin/env node

/**
 * Simple Codacy MCP Server implementation
 * This script creates a lightweight server that processes requests
 * and executes the configured Codacy CLI commands
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = process.argv[2] || path.join(__dirname, 'mcp-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const PORT = config.port || 23336;
const TOOLS = config.tools || [];
const LOG_LEVEL = config?.log?.level || 'info';
const LOG_FILE = config?.log?.file || path.join(__dirname, 'logs/mcp-server.log');

// Ensure log directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Setup logging
const logger = {
  info: (message) => {
    const logMessage = `[${new Date().toISOString()}] [INFO] ${message}\n`;
    fs.appendFileSync(LOG_FILE, logMessage);
    if (LOG_LEVEL === 'info' || LOG_LEVEL === 'debug') {
      console.log(logMessage);
    }
  },
  error: (message) => {
    const logMessage = `[${new Date().toISOString()}] [ERROR] ${message}\n`;
    fs.appendFileSync(LOG_FILE, logMessage);
    console.error(logMessage);
  },
  debug: (message) => {
    if (LOG_LEVEL === 'debug') {
      const logMessage = `[${new Date().toISOString()}] [DEBUG] ${message}\n`;
      fs.appendFileSync(LOG_FILE, logMessage);
      console.log(logMessage);
    }
  },
};

// Map of tools by name
const toolMap = TOOLS.reduce((map, tool) => {
  map[tool.name] = tool;
  return map;
}, {});

// Execute a command and return the output
function executeCommand(command, cwd) {
  logger.info(`Executing command: ${command} in directory: ${cwd}`);

  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const process = spawn(cmd, args, {
      cwd,
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      logger.debug(`Command completed with exit code: ${code}`);
      logger.debug(`stdout: ${stdout}`);

      if (code !== 0) {
        logger.error(`Command failed with exit code: ${code}`);
        logger.error(`stderr: ${stderr}`);
        reject(new Error(`Command failed with exit code: ${code}\n${stderr}`));
        return;
      }

      resolve(stdout);
    });
  });
}

// Create the HTTP server
const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS requests for CORS
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Parse the URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // Handle health check with GET or POST
  if (pathParts[0] === 'health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // Only process POST requests for tools
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  // Check if this is a tool request
  if (pathParts[0] === 'tools' && pathParts.length > 1) {
    const toolName = pathParts[1];
    const tool = toolMap[toolName];

    if (!tool) {
      logger.error(`Tool not found: ${toolName}`);
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `Tool not found: ${toolName}` }));
      return;
    }

    // Read the request body
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        // Parse the request parameters
        const params = JSON.parse(body);
        logger.debug(
          `Received request for tool: ${toolName} with params: ${JSON.stringify(params)}`,
        );

        // Process the command template with parameters
        let command = tool.command;

        // Replace parameters in the command
        for (const [key, value] of Object.entries(params)) {
          if (typeof value === 'string') {
            command = command.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
          }
        }

        // Remove any remaining template placeholders
        command = command.replace(/{{[^}]+}}/g, '');

        // Execute the command
        try {
          const output = await executeCommand(command, tool.cwd);

          // Try to parse the output as JSON
          let jsonOutput;
          try {
            jsonOutput = JSON.parse(output);
          } catch (e) {
            jsonOutput = { output };
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(jsonOutput));
        } catch (error) {
          logger.error(`Error executing command: ${error.message}`);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error.message }));
        }
      } catch (error) {
        logger.error(`Error parsing request: ${error.message}`);
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid request format' }));
      }
    });
  } else {
    // Unknown endpoint
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// Start the server
server.listen(PORT, () => {
  logger.info(`Codacy MCP Server running at http://localhost:${PORT}`);
  logger.info(`Configuration: ${configPath}`);
  logger.info(`Tools: ${TOOLS.map((t) => t.name).join(', ')}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down server...');
  server.close(() => {
    logger.info('Server stopped');
    process.exit(0);
  });
});
