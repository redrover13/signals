/**
 * @fileoverview Integration test for the MCP Client
 * 
 * This file contains tests for the MCP Client to ensure it works correctly
 * with different MCP servers.
 */

import { MCPClient, MCPServerType } from '../services/mcp';

describe('MCPClient', () => {
  // Setup and teardown
  let mockFetch: jest.SpyInstance;
  
  beforeEach(() => {
    // Mock global fetch
    mockFetch = jest.spyOn(global, 'fetch').mockImplementation(async () => {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ success: true, result: { message: 'Success' } })
      } as Response;
    });
  });
  
  afterEach(() => {
    mockFetch.mockRestore();
  });
  
  describe('constructor', () => {
    it('should create a client with default options', () => {
      const client = new MCPClient({
        serverType: MCPServerType.CODACY
      });
      
      expect(client).toBeDefined();
    });
    
    it('should throw an error for custom server without URL', () => {
      expect(() => {
        new MCPClient({
          serverType: MCPServerType.CUSTOM
        });
      }).toThrow('Custom MCP server requires a serverUrl');
    });
  });
  
  describe('execute', () => {
    it('should execute a command and return a response', async () => {
      const client = new MCPClient({
        serverType: MCPServerType.CUSTOM,
        serverUrl: 'https://example.com/api'
      });
      
      const response = await client.execute('test-command', {
        param1: 'value1'
      });
      
      expect(response.success).toBe(true);
      expect(response.result).toEqual({ message: 'Success' });
      
      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"command":"test-command"')
        })
      );
      
      await client.close();
    });
    
    it('should handle errors correctly', async () => {
      // Mock fetch to return an error
      mockFetch.mockImplementation(async () => {
        return {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        } as Response;
      });
      
      const client = new MCPClient({
        serverType: MCPServerType.CUSTOM,
        serverUrl: 'https://example.com/api'
      });
      
      await expect(client.execute('test-command', {})).rejects.toThrow(
        'HTTP error 500: Internal Server Error'
      );
      
      await client.close();
    });
  });
  
  describe('analyzeCodacy', () => {
    it('should call execute with correct parameters', async () => {
      const client = new MCPClient({
        serverType: MCPServerType.CODACY
      });
      
      // Spy on the execute method
      const executeSpy = jest.spyOn(client, 'execute').mockResolvedValue({
        success: true,
        result: { issues: [] }
      });
      
      await client.analyzeCodacy('src/main.ts', {
        tool: 'eslint'
      });
      
      expect(executeSpy).toHaveBeenCalledWith('analyze', {
        filePath: 'src/main.ts',
        tool: 'eslint',
        rules: undefined
      });
      
      await client.close();
    });
    
    it('should throw an error if not using Codacy server', async () => {
      const client = new MCPClient({
        serverType: MCPServerType.NX
      });
      
      await expect(client.analyzeCodacy('src/main.ts')).rejects.toThrow(
        'This method can only be used with a Codacy MCP server'
      );
      
      await client.close();
    });
  });
  
  describe('runNxCommand', () => {
    it('should call execute with correct parameters', async () => {
      const client = new MCPClient({
        serverType: MCPServerType.NX
      });
      
      // Spy on the execute method
      const executeSpy = jest.spyOn(client, 'execute').mockResolvedValue({
        success: true,
        result: { output: 'Build succeeded' }
      });
      
      await client.runNxCommand('my-app', 'build', {
        production: true
      });
      
      expect(executeSpy).toHaveBeenCalledWith('run', {
        project: 'my-app',
        target: 'build',
        options: { production: true }
      });
      
      await client.close();
    });
    
    it('should throw an error if not using NX server', async () => {
      const client = new MCPClient({
        serverType: MCPServerType.CODACY
      });
      
      await expect(client.runNxCommand('my-app', 'build')).rejects.toThrow(
        'This method can only be used with an NX MCP server'
      );
      
      await client.close();
    });
  });
});
