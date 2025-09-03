/**
 * @fileoverview health-check-result.interface module for the interfaces component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// Stub interface for health check results
export interface HealthCheckResult {
  serverId?: string;
  status?: 'healthy' | 'unhealthy';
  timestamp?: Date;
  responseTime?: number;
  error?: string;
}
