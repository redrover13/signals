/**
 * @fileoverview Main exports for the Dulce de Saigon F&B Data Platform environment library
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Provides centralized environment variable management with runtime validation.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// ESM exports
export { getConfig, getServerConfig, getWebConfig, getViteConfig, type Target } from './load';
export { serverSchema, webSchema, viteSchema, type ServerConfig, type WebConfig, type ViteConfig } from './schema';
