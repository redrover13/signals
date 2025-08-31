# Codacy CLI Integration with PNPM

This document describes how to use the Codacy CLI integration with PNPM in this project.

## Overview

The Codacy CLI has been integrated with PNPM to provide a seamless experience for code analysis. The integration consists of:

1. A custom script for managing the Codacy CLI installation and commands
2. A custom MCP server implementation for handling Codacy API requests
3. PNPM scripts for running Codacy CLI commands

## Setup

The setup is already complete, and the following files have been created:

- `.codacy/codacy-pnpm.sh`: Custom script for managing Codacy CLI with PNPM
- `.codacy/mcp-server.js`: Custom MCP server implementation
- `.codacy/mcp-runner.sh`: Script for starting the MCP server
- `.codacy/mcp-config.json`: Configuration for the MCP server
- `.codacy/codacy.yaml`: Configuration for Codacy analysis tools

## Available Commands

The following commands are available in the project:

- `pnpm run codacy:init`: Initialize Codacy configuration
- `pnpm run codacy:install`: Install required Codacy tools
- `pnpm run codacy:analyze [file]`: Run analysis on a file or the entire project
- `pnpm run codacy:mcp:run`: Start the Codacy MCP server

## Using the MCP Server

The MCP server is a custom implementation that provides a compatible API for the Codacy CLI. To start the server, run:

```bash
pnpm run codacy:mcp:run
```

The server will run in the background and log to `.codacy/logs/mcp-server.log`. To check if the server is running, use:

```bash
curl http://localhost:23336/health
```

## Running Analysis

To run analysis on a file or the entire project, use:

```bash
# Analyze a specific file
pnpm run codacy:analyze /path/to/file.ts

# Analyze a specific file with a specific tool
pnpm run codacy:analyze /path/to/file.ts --tool eslint

# Analyze the entire project
pnpm run codacy:analyze
```

## Configuration

The Codacy configuration is stored in `.codacy/codacy.yaml`. You can edit this file to customize the analysis tools and rules.

## Troubleshooting

If you encounter any issues, check the following:

1. Make sure the Codacy CLI is installed by running `pnpm run codacy:install`
2. Check the MCP server logs in `.codacy/logs/mcp-server.log`
3. Make sure the MCP server is running by using `curl http://localhost:23336/health`

If you need to restart the MCP server, use:

```bash
pkill -f "node.*mcp-server.js" && pnpm run codacy:mcp:run
```
