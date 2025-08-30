/**
 * @fileoverview mcp.service module for the lib component
 *
 * Main MCP service facade for Signals. Tracks enabled MCP servers (e.g., Qdrant)
 * and exposes simple lifecycle + health query APIs used by the apps.
 *
 * This is a lightweight, dependency-free implementation that derives which
 * servers are enabled from environment variables. The actual server processes
 * are launched via external configuration (e.g., .mcp/config/enhanced-mcp.json).
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

export class MCPService {
  private static instance: MCPService | null = null;

  private initialized = false;
  private enabledServers: string[] = [];
  private serverHealth: Map<string, { status: string; details?: Record<string, unknown> }> = new Map();

  private constructor() {}

  public static getInstance(): MCPService {
    if (!MCPService.instance) {
      MCPService.instance = new MCPService();
    }
    return MCPService.instance;
  }

  /**
   * Initialize MCP service.
   * Determines which servers are enabled based on environment variables.
   */
  async initialize(): Promise<void> {
    this.enabledServers = [];
    this.serverHealth.clear();

    // Enable Qdrant when URL is provided (API key may be optional locally)
    if (process.env.QDRANT_URL && process.env.QDRANT_URL.trim().length > 0) {
      this.enabledServers.push('qdrant');
      this.serverHealth.set('qdrant', { status: 'unknown' });
    }

    // Extend here for additional servers in the future
    // e.g. if (process.env.CHROMA_URL) { this.enabledServers.push('chroma'); }

    this.initialized = true;
  }

  /** Graceful shutdown, clear internal state */
  async shutdown(): Promise<void> {
    this.initialized = false;
    this.enabledServers = [];
    this.serverHealth.clear();
  }

  /** Whether the service finished initialization */
  isReady(): boolean {
    return this.initialized;
  }

  /** Get enabled server IDs (e.g., ["qdrant"]) */
  getEnabledServers(): string[] {
    return [...this.enabledServers];
  }

  /**
   * Return last known health map; statuses are placeholders in this minimal
   * implementation. External health checks can update via setServerHealth.
   */
  getServerHealth(): Map<string, { status: string; details?: Record<string, unknown> }> {
    return this.serverHealth;
  }

  /** Update health status for a specific server */
  setServerHealth(serverId: string, status: string, details?: Record<string, unknown>): void {
    if (!this.enabledServers.includes(serverId)) return;
    this.serverHealth.set(serverId, { status, details });
  }
}
