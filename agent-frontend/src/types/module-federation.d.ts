/**
 * @fileoverview module-federation.d module for the types component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Type declarations for federated modules
 */

declare module 'frontend-agents/AgentInterface' {
  import { ComponentType } from 'react';

  interface AgentInterfaceProps {
    agentId: string | undefined;
    isFederated?: boolean | undefined;
  }

  const AgentInterface: ComponentType<AgentInterfaceProps> | undefined;
  export default AgentInterface;
}
