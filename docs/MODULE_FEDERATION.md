# Module Federation Implementation

This document outlines the Module Federation setup for the Dulce de Saigon F&B Data Platform. Module Federation enables micro-frontend architecture by allowing multiple applications to share components and code at runtime.

## Overview

Module Federation allows us to:
- Share components between applications
- Load parts of the application dynamically at runtime
- Develop and deploy micro-frontends independently

## Applications

### 1. Agent Frontend (Host)

The `agent-frontend` app serves as a host application that can:
- Import and use components from other applications
- Expose its own components for use by others
- Maintain isolated development without runtime dependencies

**Key Files:**
- `module-federation.config.js`: Defines federation configuration
- `vite.config.ts`: Integrates federation plugin with Vite
- `src/app/federation-demo/index.tsx`: Demonstrates consuming remote components
- `src/types/module-federation.d.ts`: TypeScript declarations for remote modules

### 2. Frontend Agents (Remote)

The `frontend-agents` app serves as a remote application that:
- Exposes components for use by other applications
- Can also consume components from other applications
- Works independently when not federated

**Key Files:**
- `module-federation.config.js`: Defines exposed components
- `next.config.mjs`: Integrates federation plugin with Next.js
- `src/remote-entry.tsx`: Entry point for federated components
- `src/components/AgentInterface.tsx`: Exposed component

## Shared Dependencies

Both applications share:
- React and React DOM (as singletons)
- Custom signals library
- Other common dependencies

## Running the Applications

To test the Module Federation:

1. Start both applications:
   ```
   nx serve agent-frontend
   nx serve frontend-agents
   ```

2. Visit the agent-frontend app at http://localhost:4200
3. Click the "Show Federation Demo" button to see the federated component from frontend-agents

## Development Considerations

- Each application must be running for federation to work in development
- Always specify `singleton: true` for React to avoid multiple React instances
- TypeScript type declarations must be maintained for remote modules

## Future Improvements

- Add automatic error handling for unavailable remotes
- Implement versioning strategy for shared components
- Set up CI/CD pipeline for proper deployment order
- Add monitoring for micro-frontend performance
