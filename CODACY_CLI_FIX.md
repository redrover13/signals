# Codacy CLI JSON Parsing Error Fix

## Problem

The Codacy CLI tool was encountering a `SyntaxError: Unexpected number in JSON at position 21` error when trying to fetch the latest version information from the GitHub API. This error prevented the CLI from running correctly and blocked Codacy MCP Server integration.

## Root Cause

The error occurs when the Codacy CLI script attempts to parse a response from the GitHub API. At position 21 in the JSON response is a numeric ID that is not properly handled by the parsing logic in the script.

```json
{
  "url": "https://api.github.com/repos/codacy/codacy-cli-v2/releases/241147657",
                                                                 ^
                                                         Position 21 is here
```

## Solution Implemented

We've created a fixed version of the Codacy CLI script that:

1. Bypasses the GitHub API call completely
2. Uses a known working version (`1.0.0-main.354.sha.642d8bf`) directly
3. Properly sets up the environment for both CLI and MCP server integration

## How to Use the Fixed Version

### For Command Line Usage

Instead of using the original `.codacy/cli.sh` script, use our fixed wrapper:

```bash
./.codacy/codacy-fixed.sh analyze [options]
```

For example:

```bash
./.codacy/codacy-fixed.sh analyze --format sarif --output results.sarif ./package.json
```

### For MCP Server Integration

If you're still experiencing issues with the Codacy MCP Server integration in VS Code:

1. Restart VS Code to apply the environment variable changes
2. If errors persist, try running the MCP runner script directly:
   ```bash
   ./.codacy/mcp-runner.sh analyze [options]
   ```

3. Configure the MCP server to use the fixed script by modifying your VS Code settings:
   - Open VS Code settings (File > Preferences > Settings)
   - Search for "Codacy"
   - Add a custom script path pointing to `.codacy/mcp-runner.sh`

## Troubleshooting

If you continue to experience issues:

1. Verify that the environment variable is set:
   ```bash
   echo $CODACY_CLI_V2_VERSION
   ```
   This should output `1.0.0-main.354.sha.642d8bf`

2. Check the cached version file:
   ```bash
   cat /home/g_nelson/.cache/codacy/codacy-cli-v2/version.yaml
   ```
   This should contain `version: "1.0.0-main.354.sha.642d8bf"`

3. Reset the MCP server connection in VS Code
   - Open the Command Palette (Ctrl+Shift+P)
   - Search for "Reset MCP Server" and select it
   - Restart VS Code

## Long-term Solution

This fix provides a workaround for the immediate issue. For a long-term solution, consider:

1. Monitoring for updates to the official Codacy CLI tool
2. Reporting the issue to Codacy support
3. Implementing a more robust JSON parsing approach in the original script

## Support

If you encounter any issues with this fix, please contact the development team.
