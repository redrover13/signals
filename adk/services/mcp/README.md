# MCP Integration for Agent Developer Kit

This document provides guidelines for using the Model Context Protocol (MCP) integration in the Agent Developer Kit (ADK).

## Overview

The MCP integration in the ADK provides a universal client for interacting with Model Context Protocol (MCP) servers such as Codacy, NX, GitHub, and others. It handles authentication, request formatting, and response parsing, making it easy to add AI-powered capabilities to your agents.

## Features

- **Universal MCP Client**: A single client for interacting with multiple MCP servers
- **Protocol Adapters**: Adapters for different MCP server protocols
- **Schema Validation**: Validation for MCP requests and responses
- **Error Handling**: Comprehensive error handling for MCP operations
- **Debugging**: Debug logging for troubleshooting MCP interactions

## Supported MCP Servers

The MCP integration currently supports the following MCP servers:

- **Codacy**: For code quality analysis
- **NX**: For monorepo management
- **GitHub**: For GitHub operations
- **Playwright**: For browser automation
- **Custom**: For custom MCP servers

## Getting Started

### Installation

The MCP integration is included in the ADK package. Make sure you have the ADK installed:

```bash
pnpm install
```

### Basic Usage

```typescript
import { MCPClient, MCPServerType } from 'adk';

// Create a client for the Codacy MCP server
const client = new MCPClient({
  serverType: MCPServerType.CODACY,
  credentials: process.env.CODACY_TOKEN,
  debug: true
});

// Analyze a file using Codacy
const result = await client.analyzeCodacy('src/main.ts', {
  tool: 'eslint',
  rules: ['security', 'performance']
});

console.log('Codacy analysis result:', result);

// Always close the client when done
await client.close();
```

### Server-Specific Methods

The MCP client provides server-specific methods for common operations:

#### Codacy

```typescript
// Analyze a file using Codacy
const result = await client.analyzeCodacy('src/main.ts', {
  tool: 'eslint',
  rules: ['security', 'performance']
});
```

#### NX

```typescript
// Run an NX command
const result = await client.runNxCommand('my-app', 'build', {
  production: true
});
```

### Generic Execute Method

For operations not covered by server-specific methods, you can use the generic `execute` method:

```typescript
// Execute a custom command
const result = await client.execute('custom-command', {
  param1: 'value1',
  param2: 'value2'
});
```

## Configuration Options

The MCP client accepts the following configuration options:

- **serverType**: The type of MCP server to connect to (required)
- **credentials**: Authentication credentials for the MCP server (optional)
- **serverUrl**: Custom server URL for non-standard MCP servers (required for custom servers)
- **timeout**: Request timeout in milliseconds (default: 30000)
- **debug**: Whether to enable debug logging (default: false)

## Best Practices

1. **Resource Management**: Always close the MCP client when done to release resources:
   ```typescript
   try {
     // Use the client
   } finally {
     await client.close();
   }
   ```

2. **Error Handling**: Always handle errors from MCP operations:
   ```typescript
   try {
     const result = await client.execute('command', params);
   } catch (error) {
     console.error('MCP operation failed:', error);
     // Handle the error
   }
   ```

3. **Credentials Management**: Store MCP credentials securely, preferably in environment variables:
   ```typescript
   const client = new MCPClient({
     serverType: MCPServerType.CODACY,
     credentials: process.env.CODACY_TOKEN
   });
   ```

4. **Validation**: The MCP client validates requests and responses automatically, but you should still validate your input parameters.

## Examples

See the `examples/mcp-client-example.ts` file for complete examples of using the MCP client with different servers.

## Extending

### Adding a New MCP Server

To add support for a new MCP server:

1. Add a new server type to the `MCPServerType` enum in `client.ts`
2. Create a new adapter class in `adapters/index.ts` that extends `MCPProtocolAdapter`
3. Implement the `sendRequest` and `close` methods for your adapter
4. Update the `create` factory method in `MCPProtocolAdapter` to return your adapter for the new server type

Example:

```typescript
// Add to MCPServerType enum
export enum MCPServerType {
  // Existing types...
  NEW_SERVER = 'new-server'
}

// Create a new adapter
export class NewServerMCPAdapter extends MCPProtocolAdapter {
  async sendRequest<TParams, TResult>(
    request: MCPRequest<TParams>
  ): Promise<MCPResponse<TResult>> {
    // Implement your adapter
  }
  
  async close(): Promise<void> {
    // Clean up resources
  }
}

// Update the create factory method
static create(serverType: MCPServerType, config: MCPAdapterConfig): MCPProtocolAdapter {
  switch (serverType) {
    // Existing cases...
    case MCPServerType.NEW_SERVER:
      return new NewServerMCPAdapter(config);
    default:
      throw new Error(`Unsupported MCP server type: ${serverType}`);
  }
}
```

## Troubleshooting

### Debugging

Enable debug logging to see detailed information about MCP operations:

```typescript
const client = new MCPClient({
  serverType: MCPServerType.CODACY,
  debug: true
});
```

### Common Issues

#### Authentication Failures

If you're experiencing authentication failures:

1. Check that you're providing valid credentials
2. Verify that the credentials have the necessary permissions
3. Ensure that the MCP server is accessible from your environment

#### Timeout Errors

If you're experiencing timeout errors:

1. Increase the timeout value in the client configuration
2. Check network connectivity to the MCP server
3. Verify that the MCP server is not overloaded

## Future Enhancements

- **Caching**: Add caching for MCP responses to improve performance
- **Rate Limiting**: Add rate limiting to avoid overloading MCP servers
- **Batch Operations**: Support for batching multiple operations in a single request
- **Streaming**: Support for streaming responses from MCP servers
- **More Servers**: Add support for more MCP servers

## Contributing

To contribute to the MCP integration:

1. Add tests for your changes in the `__tests__` directory
2. Ensure that all tests pass with `pnpm test`
3. Update the documentation to reflect your changes
4. Submit a pull request

## License

The MCP integration is part of the ADK and is covered by the same license.
