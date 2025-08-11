# Agents App (`apps/agents`)

This application runs the agent service for the Dulce de Saigon platform.

## Overview

- **Entry point:** `src/main.ts`
- **Purpose:** Hosts the agent runner and exposes agent APIs.
- **Integration:** Uses the `libs/agents` library for agent logic and tools.

## Nx Integration

- Run locally: `nx run agents:dev` or `nx run agents:serve`
- Build: `nx run agents:build`
- Lint: `nx run agents:lint`
- Project config: `project.json`, `tsconfig.json`

## Common Issues

- Agent not responding: Check agent registration and message flow in `src/main.ts`.
- Type errors: Check shared types in `libs/` and `tsconfig.json` paths.
- Environment variables: Ensure `.env` or CI/CD secrets are set.

## Documentation

- See also: `docs/ARCHITECTURE.md`, `docs/TROUBLESHOOTING.md`, and `apps/agents/COPILOT_PROMPT.md` for more context.

---
*Update this README as the agents app evolves or workflows change.*
