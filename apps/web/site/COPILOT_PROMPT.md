# Copilot Prompt: Web/Site App

## Purpose
This file provides Copilot and contributors with targeted context for the `apps/web/site` frontend. It addresses real quirks and pain points specific to this app.

## Key Points
- **Entrypoint:**
  - Main file: `components/Track.tsx` (and others in `components/`)
- **Nx Integration:**
  - Use `nx run web:serve` for local dev.
  - Project config: `project.json`, `tsconfig.json`.
- **Common Issues:**
  - Component not rendering: check `components/` and import paths.
  - Type errors: check shared types in `libs/` and `tsconfig.json` paths.
  - Environment variables: ensure `.env` or CI/CD secrets are set.
- **Docs:**
  - See `docs/ARCHITECTURE.md` and `docs/TROUBLESHOOTING.md`.

---
*Update this file if Web/Site app workflows or pain points change.*
