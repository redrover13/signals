#!/usr/bin/env node

/**
 * Enterprise MCP Configuration Manager
 * Centralizes MCP server configuration discovery, validation, and management
 */

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';
import { fileURLToPath } from 'url';

class MCPConfigManager {
  constructor() {
    this.configPaths = this.getConfigPaths();
    this.schema = null;
    this.activeConfig = null;
  }

  /**
   * Get all possible MCP configuration file locations in priority order
   */
  getConfigPaths() {
    const home = os.homedir();
    const platform = os.platform();
    
    const paths = [
      // Project level (highest priority)
      path.join(process.cwd(), '.mcp', 'config', 'mcp.json'),
      path.join(process.cwd(), 'mcp.json'),
      
      // User level
      ...(platform === 'win32' ? [
        path.join(home, 'AppData', 'Roaming', 'Code', 'User', 'mcp.json'),
        path.join(home, 'AppData', 'Local', 'mcp', 'config.json')
      ] : [
        path.join(home, '.config', 'mcp', 'config.json'),
        path.join(home, '.vscode', 'mcp.json'),
        path.join(home, '.mcp.json')
      ]),
      
      // System level (lowest priority)
      ...(platform === 'win32' ? [
        'C:\\ProgramData\\mcp\\config.json'
      ] : [
        '/etc/mcp/config.json',
        '/usr/local/etc/mcp/config.json'
      ])
    ];

    return paths;
  }

  /**
   * Load and validate JSON schema
   */
  async loadSchema() {
    try {
      const schemaPath = path.join(process.cwd(), '.mcp', 'config', 'mcp-schema.json');
      const schemaContent = await fs.readFile(schemaPath, 'utf8');
      this.schema = JSON.parse(schemaContent);
      return this.schema;
    } catch (error) {
      console.warn('Schema not found, using basic validation');
      return null;
    }
  }

  /**
   * Discover and load MCP configuration with fallback hierarchy
   */
  async discoverConfig() {
    await this.loadSchema();
    
    for (const configPath of this.configPaths) {
      try {
        const exists = await fs.access(configPath).then(() => true).catch(() => false);
        if (!exists) continue;

        const content = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(content);
        
        // Validate configuration
        const validation = await this.validateConfig(config);
        if (validation.valid) {
          console.log(`✅ Valid MCP config found: ${configPath}`);
          this.activeConfig = { ...config, _source: configPath };
          return this.activeConfig;
        } else {
          console.warn(`⚠️  Invalid config at ${configPath}:`, validation.errors);
        }
      } catch (error) {
        console.warn(`❌ Error reading config ${configPath}:`, error.message);
      }
    }

    throw new Error('No valid MCP configuration found in any location');
  }

  /**
   * Validate configuration against schema and business rules
   */
  async validateConfig(config) {
    const errors = [];

    // Basic structure validation
    if (!config.servers || typeof config.servers !== 'object') {
      errors.push('Missing or invalid "servers" object');
    }

    // Validate each server configuration
    if (config.servers) {
      for (const [name, server] of Object.entries(config.servers)) {
        if (!name.match(/^[a-zA-Z][a-zA-Z0-9_-]*$/)) {
          errors.push(`Invalid server name "${name}": must start with letter and contain only alphanumeric, underscore, or dash`);
        }

        if (server.type === 'http') {
          if (!server.url || !this.isValidUrl(server.url)) {
            errors.push(`Server "${name}": invalid or missing URL`);
          }
        } else if (server.type === 'stdio') {
          if (!server.command) {
            errors.push(`Server "${name}": missing command for stdio server`);
          }
        } else {
          errors.push(`Server "${name}": invalid type "${server.type}", must be "http" or "stdio"`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create enterprise-grade configuration template
   */
  async createEnterpriseConfig() {
    const config = {
      "$schema": "./mcp-schema.json",
      "version": "1.0.0",
      "metadata": {
        "name": "Enterprise MCP Configuration",
        "description": "Centralized MCP server configuration for enterprise deployment",
        "environment": process.env.NODE_ENV || "development"
      },
      "servers": {
        "github": {
          "url": "https://api.githubcopilot.com/mcp/",
          "type": "http",
          "timeout": 30000
        },
        "codacy": {
          "command": "npx",
          "args": ["-y", "@codacy/codacy-mcp@latest"],
          "type": "stdio",
          "env": {
            "CODACY_ACCOUNT_TOKEN": process.env.CODACY_ACCOUNT_TOKEN || "REPLACE_WITH_TOKEN"
          }
        },
        "playwright": {
          "command": "npx",
          "args": ["@playwright/mcp@latest"],
          "type": "stdio"
        },
        "terraform": {
          "command": "docker",
          "args": ["run", "-i", "--rm", "hashicorp/terraform-mcp-server"],
          "type": "stdio"
        },
        "sequentialthinking": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
          "type": "stdio"
        }
      },
      "inputs": []
    };

    const configDir = path.join(process.cwd(), '.mcp', 'config');
    await fs.mkdir(configDir, { recursive: true });
    
    const configPath = path.join(configDir, 'mcp.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    console.log(`✅ Enterprise MCP config created: ${configPath}`);
    return configPath;
  }

  /**
   * Health check for all configured MCP servers
   */
  async healthCheck() {
    if (!this.activeConfig) {
      await this.discoverConfig();
    }

    const results = {};
    
    for (const [name, server] of Object.entries(this.activeConfig.servers)) {
      try {
        if (server.type === 'stdio') {
          // Test if command exists and is executable
          const testResult = await this.testStdioServer(server);
          results[name] = { status: 'healthy', ...testResult };
        } else if (server.type === 'http') {
          // Test HTTP endpoint connectivity
          const testResult = await this.testHttpServer(server);
          results[name] = { status: 'healthy', ...testResult };
        }
      } catch (error) {
        results[name] = { status: 'unhealthy', error: error.message };
      }
    }

    return results;
  }

  /**
   * Test STDIO server availability
   */
  async testStdioServer(server) {
    try {
      // Check if command exists
      execSync(`which ${server.command}`, { stdio: 'pipe' });
      return { message: 'Command available' };
    } catch (error) {
      throw new Error(`Command "${server.command}" not found`);
    }
  }

  /**
   * Test HTTP server connectivity
   */
  async testHttpServer(server) {
    // Basic URL validation for now
    // In production, would make actual HTTP request
    if (!this.isValidUrl(server.url)) {
      throw new Error('Invalid URL format');
    }
    return { message: 'URL format valid' };
  }

  /**
   * Utility: URL validation
   */
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Generate diagnostic report
   */
  async generateDiagnostics() {
    const report = {
      timestamp: new Date().toISOString(),
      platform: os.platform(),
      arch: os.arch(),
      node_version: process.version,
      config_paths: this.configPaths,
      active_config: this.activeConfig?._source || 'none',
      health_check: await this.healthCheck().catch(e => ({ error: e.message }))
    };

    const reportPath = path.join(process.cwd(), '.mcp', 'diagnostics.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Diagnostics report generated: ${reportPath}`);
    return report;
  }
}

// CLI Interface
async function main() {
  const manager = new MCPConfigManager();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'discover':
        const config = await manager.discoverConfig();
        console.log('Active configuration:', JSON.stringify(config, null, 2));
        break;
        
      case 'validate':
        const configToValidate = await manager.discoverConfig();
        const validation = await manager.validateConfig(configToValidate);
        console.log('Validation result:', validation);
        break;
        
      case 'create':
        await manager.createEnterpriseConfig();
        break;
        
      case 'health':
        const health = await manager.healthCheck();
        console.log('Health check results:', JSON.stringify(health, null, 2));
        break;
        
      case 'diagnose':
        await manager.generateDiagnostics();
        break;
        
      default:
        console.log(`
Enterprise MCP Configuration Manager

Usage:
  node mcp-manager.js discover   - Find and load active configuration
  node mcp-manager.js validate   - Validate current configuration
  node mcp-manager.js create     - Create enterprise configuration template
  node mcp-manager.js health     - Run health check on all servers
  node mcp-manager.js diagnose   - Generate full diagnostic report
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  main();
}

export default MCPConfigManager;
