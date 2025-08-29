/**
 * @fileoverview remote-entry module for the src component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Remote entry point for frontend-agents app
 *
 * This file is the entry point for Module Federation integration.
 * It exposes components that can be consumed by other applications.
 */
import dynamic from 'next/dynamic';

// Export the components that are defined in module-federation.config.js
const AgentInterface = dynamic(() => import('./components/AgentInterface'), {
  ssr: false,
});

// Export the components
export { AgentInterface };
