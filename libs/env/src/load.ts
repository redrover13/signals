/**
 * @fileoverview Environment variable loading and validation for the Dulce de Saigon F&B Data Platform
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains environment variable loading and validation logic.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { serverSchema, webSchema, viteSchema, ServerConfig, WebConfig, ViteConfig } from './schema';

// Check if we're in a Vite environment using globalThis to avoid import.meta issues in Jest
const isViteEnvironment = (): boolean => {
  try {
    // Use globalThis to avoid compilation issues with import.meta in Jest
    return (globalThis as any).VITE_MODE !== undefined || 
           (typeof globalThis !== 'undefined' && 'import' in globalThis && 'meta' in (globalThis as any).import);
  } catch {
    return false;
  }
};

/**
 * Reads an environment variable from the appropriate source
 * In Vite environments, checks import.meta.env first, then falls back to process.env
 * In Node environments, reads from process.env
 */
const read = (key: string): string | undefined => {
  if (isViteEnvironment()) {
    try {
      // Use eval to avoid TypeScript compilation issues with import.meta
      const viteEnv = eval('typeof import !== "undefined" && import && import.meta && import.meta.env');
      if (viteEnv) {
        return viteEnv[key] ?? process.env[key];
      }
    } catch {
      // Fall back to process.env if import.meta access fails
    }
  }
  return process.env[key];
};

export type Target = 'api' | 'agents' | 'web' | 'agent-frontend';

/**
 * Gets and validates configuration for a specific target
 * @param target - The target application type
 * @returns Validated configuration object
 * @throws Error if validation fails
 */
export function getConfig(target: Target): ServerConfig | WebConfig | ViteConfig {
  // Create a proxy that reads environment variables on demand
  const snapshot = new Proxy({}, {
    get: (_, k: string) => read(k),
  }) as Record<string, string | undefined>;

  if (target === 'web') {
    return webSchema.parse(snapshot);
  }
  if (target === 'agent-frontend') {
    return viteSchema.parse(snapshot);
  }
  // api & agents use server schema
  return serverSchema.parse(snapshot);
}

/**
 * Type-safe configuration getter with specific return types
 */
export function getServerConfig(): ServerConfig {
  return getConfig('api') as ServerConfig;
}

export function getWebConfig(): WebConfig {
  return getConfig('web') as WebConfig;
}

export function getViteConfig(): ViteConfig {
  return getConfig('agent-frontend') as ViteConfig;
}