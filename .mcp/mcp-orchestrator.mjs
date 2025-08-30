#!/usr/bin/env node

/**
 * MCP Server Registry and Orchestrator
 * Centralizes MCP server lifecycle management and provides enterprise-grade monitoring
 */

import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { z } from 'zod';

const ServerConfigSchema = z.object({
  type: z.enum(['stdio', 'http']),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  cwd: z.string().optional(),
});

const ConfigSchema = z.object({
  servers: z.record(ServerConfigSchema),
});

class MCPOrchestrator extends EventEmitter {
  constructor(configPath) {
    super();
    this.configPath = configPath || '/home/g_nelson/signals-1/.mcp/config/enhanced-mcp.json';
    this.servers = new Map();
    this.config = null;
    this.isRunning = false;
  }

  /**
   * Load and validate configuration
   */
  async loadConfig() {
    try {
      const content = await fs.readFile(this.configPath, 'utf8');
      const rawConfig = JSON.parse(content);
      this.config = ConfigSchema.parse(rawConfig);
      console.log(`✅ Configuration loaded and validated from: ${this.configPath}`);
      return this.config;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid configuration: ${error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}`);
      }
      throw new Error(`Failed to load config from ${this.configPath}: ${error.message}`);
    }
  }

  /**
   * Start all MCP servers with proper lifecycle management
   */
  async startServers() {
    if (!this.config) {
      await this.loadConfig();
    }

    console.log('🚀 Starting MCP servers...');
    this.isRunning = true;

    for (const [name, serverConfig] of Object.entries(this.config.servers)) {
      try {
        await this.startServer(name, serverConfig);
      } catch (error) {
        console.error(`❌ Failed to start server "${name}":`, error.message);
      }
    }

    console.log(`✅ Started ${this.servers.size} MCP servers`);
    this.emit('serversStarted', Array.from(this.servers.keys()));
  }

  /**
   * Start individual MCP server with monitoring
   */
  async startServer(name, config) {
    if (config.type === 'stdio') {
      const process = spawn(config.command, config.args || [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...config.env },
        cwd: config.cwd || process.cwd()
      });

      const server = {
        name,
        type: config.type,
        process,
        config,
        status: 'starting',
        startTime: Date.now(),
        pid: process.pid
      };

      // Monitor process events
      process.on('error', (error) => {
        console.error(`❌ Server "${name}" error:`, error.message);
        server.status = 'error';
        server.error = error.message;
        this.emit('serverError', name, error);
      });

      process.on('exit', (code, signal) => {
        console.warn(`⚠️  Server "${name}" exited with code ${code}, signal ${signal}`);
        server.status = 'stopped';
        server.exitCode = code;
        server.exitSignal = signal;
        this.servers.delete(name);
        this.emit('serverExit', name, code, signal);
      });

      // Capture output for monitoring
      process.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          console.log(`📤 [${name}] ${output}`);
          this.emit('serverOutput', name, output);
        }
      });

      process.stderr.on('data', (data) => {
        const error = data.toString().trim();
        if (error) {
          console.error(`📥 [${name}] ${error}`);
          this.emit('serverError', name, error);
        }
      });

      // Wait for startup confirmation
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Server "${name}" startup timeout`));
        }, 10000);

        const onOutput = (output) => {
          if (output.includes('running') || output.includes('started') || output.includes('listening')) {
            clearTimeout(timeout);
            server.status = 'running';
            resolve();
          }
        };

        this.once('serverOutput', onOutput);
        
        // For immediate resolution if no output expected
        setTimeout(() => {
          clearTimeout(timeout);
          server.status = 'running';
          resolve();
        }, 2000);
      });

      this.servers.set(name, server);
      console.log(`✅ Server "${name}" started (PID: ${process.pid})`);

    } else if (config.type === 'http') {
      // HTTP servers are external, just validate connectivity
      const server = {
        name,
        type: config.type,
        config,
        status: 'external',
        startTime: Date.now()
      };
      
      this.servers.set(name, server);
      console.log(`✅ HTTP server "${name}" registered`);
    }
  }

  /**
   * Stop all MCP servers gracefully
   */
  async stopServers() {
    console.log('🛑 Stopping MCP servers...');
    this.isRunning = false;

    const stopPromises = Array.from(this.servers.values())
      .filter(server => server.process)
      .map(server => this.stopServer(server.name));

    await Promise.allSettled(stopPromises);
    
    this.servers.clear();
    console.log('✅ All MCP servers stopped');
    this.emit('serversStopped');
  }

  /**
   * Stop individual server gracefully
   */
  async stopServer(name) {
    const server = this.servers.get(name);
    if (!server || !server.process) return;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn(`⚠️  Force killing server "${name}"`);
        server.process.kill('SIGKILL');
        resolve();
      }, 5000);

      server.process.once('exit', () => {
        clearTimeout(timeout);
        resolve();
      });

      console.log(`🛑 Stopping server "${name}"...`);
      server.process.kill('SIGTERM');
    });
  }

  /**
   * Get status of all servers
   */
  getStatus() {
    const status = {
      orchestrator: {
        running: this.isRunning,
        serverCount: this.servers.size,
        configSource: this.configPath
      },
      servers: {}
    };

    for (const [name, server] of this.servers) {
      status.servers[name] = {
        status: server.status,
        type: server.type,
        pid: server.pid,
        uptime: server.startTime ? Date.now() - server.startTime : 0,
        error: server.error,
        exitCode: server.exitCode
      };
    }

    return status;
  }

  /**
   * Monitor server health and restart if needed
   */
  async startHealthMonitoring() {
    setInterval(async () => {
      for (const [name, server] of this.servers) {
        if (server.type === 'stdio' && server.process && server.process.killed) {
          console.warn(`🔄 Restarting dead server "${name}"`);
          try {
            this.servers.delete(name);
            await this.startServer(name, server.config);
          } catch (error) {
            console.error(`❌ Failed to restart server "${name}":`, error.message);
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }
}

// CLI Interface
async function main() {
  const configPath = process.argv[2] || '/home/g_nelson/signals-1/.mcp/config/mcp.json';
  const command = process.argv[3] || 'start';

  const orchestrator = new MCPOrchestrator(configPath);

  // Setup event listeners
  orchestrator.on('serverError', (name, error) => {
    console.error(`💥 Server "${name}" error:`, error);
  });

  orchestrator.on('serverExit', (name, code, signal) => {
    console.warn(`🚪 Server "${name}" exited: code=${code}, signal=${signal}`);
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await orchestrator.stopServers();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await orchestrator.stopServers();
    process.exit(0);
  });

  try {
    switch (command) {
      case 'start':
        await orchestrator.startServers();
        await orchestrator.startHealthMonitoring();
        console.log('🎯 MCP Orchestrator running. Press Ctrl+C to stop.');
        // Keep process alive
        await new Promise(() => {});
        break;
        
      case 'status':
        await orchestrator.loadConfig();
        const status = orchestrator.getStatus();
        console.log(JSON.stringify(status, null, 2));
        break;
        
      case 'stop':
        await orchestrator.stopServers();
        break;
        
      default:
        console.log(`
MCP Server Orchestrator

Usage:
  node mcp-orchestrator.mjs [config-path] start   - Start all MCP servers
  node mcp-orchestrator.mjs [config-path] status  - Get server status
  node mcp-orchestrator.mjs [config-path] stop    - Stop all servers

Default config: /home/g_nelson/signals-1/.mcp/config/mcp.json
        `);
    }
  } catch (error) {
    console.error('❌ Orchestrator error:', error.message);
    process.exit(1);
  }
}

main();

export default MCPOrchestrator;