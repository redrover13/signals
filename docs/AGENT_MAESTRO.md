# Agent Maestro Usage Guide

Agent Maestro is a headless VS Code AI integration that allows you to integrate best-in-class AI agents into your workflow. This guide explains how to effectively use Agent Maestro with the Signals project.

## What is Agent Maestro?

Agent Maestro is a VS Code extension that acts as a bridge between your code and various AI services. It supports:

- Multiple AI providers including Claude Code via Anthropic-compatible endpoints
- Integration with MCP (Model Context Protocol) servers
- Automated tasks and assistance without leaving your editor
- Seamless workflow integration with your existing tools

## Setup

Agent Maestro is already configured for this project. The configuration files are:

- `.agent-maestro.json` - Main configuration file
- `.vscode/settings.json` - VS Code specific settings
- `.mcp/config/enhanced-mcp.json` - MCP server configuration

## Environment Variables

To use Agent Maestro, you need to set up these environment variables:

```
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token
CODACY_API_TOKEN=your_codacy_token
ANTHROPIC_API_KEY=your_anthropic_key  # Optional, for Claude Code
```

You can add these to your `.env.local` file or set them in your environment.

## Using Agent Maestro

### Basic Usage

1. Open the Command Palette (Ctrl+Shift+P)
2. Type "Agent Maestro" to see available commands
3. Select the command you want to use

### Key Commands

- **Agent Maestro: Start Agent** - Start a new agent session
- **Agent Maestro: Show Sidebar** - Open the Agent Maestro sidebar
- **Agent Maestro: Generate Code** - Generate code for current file
- **Agent Maestro: Explain Code** - Get an explanation of selected code
- **Agent Maestro: Fix Code** - Suggest fixes for selected code
- **Agent Maestro: Run MCP Command** - Execute a command through an MCP server

### Using with MCP Servers

Agent Maestro is configured to work with our MCP servers:

1. **GitHub MCP Server**: For repository operations, PR management, and code analysis
2. **Codacy MCP Server**: For code quality checks and analysis

Example usage:
```
# Using GitHub MCP Server
/github list_repositories

# Using Codacy MCP Server
/codacy analyze_file path/to/file.ts
```

### Keyboard Shortcuts

- `Alt+M A` - Start Agent Maestro
- `Alt+M C` - Generate Code
- `Alt+M E` - Explain Code
- `Alt+M F` - Fix Code
- `Alt+M S` - Show Sidebar

## Best Practices

1. **Start with specific requests** - The more specific your request, the better the results
2. **Use project context** - Reference existing files and patterns in your requests
3. **Leverage MCP servers** - Use the appropriate MCP server for each task
4. **Chain commands** - Combine multiple commands for complex tasks
5. **Review generated code** - Always review AI-generated code before committing

## Troubleshooting

If Agent Maestro isn't working properly:

1. Check that your environment variables are set correctly
2. Ensure the MCP servers are running
3. Restart VS Code
4. Check the Agent Maestro logs in the Output panel (View > Output > Agent Maestro)

## Integration with Nx

Agent Maestro works well with our Nx monorepo structure:

- Use project-specific contexts by specifying the app or lib
- Reference the correct import paths in your requests
- Ask Agent Maestro to generate code that follows our project structure

## Further Resources

- [Agent Maestro Documentation](https://marketplace.visualstudio.com/items?itemName=joouis.agent-maestro)
- [Model Context Protocol (MCP) Documentation](https://github.com/modelcontextprotocol/specification)
- [Claude Code Documentation](https://docs.anthropic.com/claude/docs/claude-3-code)
