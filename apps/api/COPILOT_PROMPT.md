# Copilot Prompt: API App

## Purpose
This file provides Copilot and contributors with targeted context for the `apps/api` service. It addresses real quirks and pain points specific to this app.

## Key Points
- **Entrypoint:**
  - Main file: `src/main.ts`
  - Routes: `src/routes/`
- **Nx Integration:**
  - Use `nx run api:serve` for local dev.
  - Project config: `project.json`, `tsconfig.json`.
- **Common Issues:**
  - Route not found: check `src/routes/` and ensure route is registered in `main.ts`.
  - Type errors: check shared types in `libs/` and `tsconfig.json` paths.
  - Environment variables: ensure `.env` or CI/CD secrets are set.
- **Docs:**
  - See `docs/ARCHITECTURE.md` and `docs/TROUBLESHOOTING.md`.

---
*Update this file if API app workflows or pain points change.*
