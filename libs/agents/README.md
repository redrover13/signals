# Agents Library (`libs/agents`)

This library provides the core types and runner skeleton for agent-based workflows in the Dulce de Saigon platform.

## Overview

- **Purpose:** Defines agent types, configuration, and a minimal runner loop for agent execution.
- **Integration:** Not yet fully wired into the main app flow. Intended for use by the `apps/agents` service and future ADK/Vertex integration.

## Key Files

- `src/index.ts`: Core types (`Tool`, `AgentConfig`) and the `runAgent` runner function.
- `src/tools.ts`: Example tool definitions for BigQuery and Cloud Storage (see `@dulce/gcp`).

## Usage

- Import `runAgent` and `AgentConfig` to define and execute agent tasks.
- Extend with additional tools as needed for your workflow.

## Next Steps

- Integrate with ADK and Vertex AI for advanced agent capabilities.
- Expand toolset and connect to real data sources.

---
*Create or update this README as the agent library evolves.*
