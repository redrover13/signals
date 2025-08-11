# Copilot Prompt: Agents App

## Purpose
This file provides Copilot and contributors with targeted context for the `apps/agents` service. It addresses real quirks and pain points specific to this app.

## Key Points
- **Entrypoint:**
  - Main file: `src/main.ts`
- **Nx Integration:**
  - Use `nx run agents:serve` for local dev.
  - Project config: `project.json`, `tsconfig.json`.
- **Common Issues:**
  - Agent not responding: check agent registration and message flow in `src/main.ts`.
  - Type errors: check shared types in `libs/` and `tsconfig.json` paths.
  - Environment variables: ensure `.env` or CI/CD secrets are set.
- **Docs:**
  - See `docs/ARCHITECTURE.md` and `docs/TROUBLESHOOTING.md`.

---
*Update this file if Agents app workflows or pain points change.*
