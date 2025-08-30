/**
 * @fileoverview Example usage of the MCP Client
 * 
 * This file demonstrates how to use the MCP Client to interact with different MCP servers.
 */

import { MCPClient, MCPServerType } from '../services/mcp';

/**
 * Example of using the MCP Client with Codacy
 */
async function codacyExample() {
  // Create a client for the Codacy MCP server
  const client = new MCPClient({
    serverType: MCPServerType.CODACY,
    credentials: process.env.CODACY_TOKEN,
    debug: true
  });
  
  try {
    // Analyze a file using Codacy
    const result = await client.analyzeCodacy('src/main.ts', {
      tool: 'eslint',
      rules: ['security', 'performance']
    });
    
    console.log('Codacy analysis result:', result);
    
    // You can also use the generic execute method
    const genericResult = await client.execute('analyze', {
      filePath: 'src/main.ts',
      tool: 'eslint'
    });
    
    console.log('Generic execution result:', genericResult);
  } catch (error) {
    console.error('Error in Codacy example:', error);
  } finally {
    // Always close the client when done
    await client.close();
  }
}

/**
 * Example of using the MCP Client with NX
 */
async function nxExample() {
  // Create a client for the NX MCP server
  const client = new MCPClient({
    serverType: MCPServerType.NX,
    debug: true
  });
  
  try {
    // Run an NX command
    const result = await client.runNxCommand('my-app', 'build', {
      production: true
    });
    
    console.log('NX command result:', result);
  } catch (error) {
    console.error('Error in NX example:', error);
  } finally {
    // Always close the client when done
    await client.close();
  }
}

/**
 * Example of using the MCP Client with a custom server
 */
async function customExample() {
  // Create a client for a custom MCP server
  const client = new MCPClient({
    serverType: MCPServerType.CUSTOM,
    serverUrl: 'https://my-custom-mcp-server.example.com/api',
    credentials: process.env.CUSTOM_MCP_TOKEN,
    debug: true
  });
  
  try {
    // Execute a custom command
    const result = await client.execute('custom-command', {
      param1: 'value1',
      param2: 'value2'
    });
    
    console.log('Custom command result:', result);
  } catch (error) {
    console.error('Error in custom example:', error);
  } finally {
    // Always close the client when done
    await client.close();
  }
}

/**
 * Main function to run the examples
 */
async function main() {
  console.log('Running MCP Client examples...');
  
  await codacyExample();
  await nxExample();
  await customExample();
  
  console.log('All examples completed');
}

// Run the examples if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error running examples:', error);
    process.exit(1);
  });
}
