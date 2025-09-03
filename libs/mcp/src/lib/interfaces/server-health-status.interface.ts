/**
 * @fileoverview server-health-status.interface module for the interfaces component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// Stub interface for server health status
export interface ServerHealthStatus {
  serverId?: string;
  status?: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck?: Date;
  uptime?: number;
  responseTime?: number;
}
