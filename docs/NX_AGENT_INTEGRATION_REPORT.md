# NX Report for Agent Integration: Builds, Reporting, and Strategies

## Overview
This report outlines the order of builds, reporting mechanisms, strategies for integration, and how to incorporate Google Agents SDK (Vertex AI with Gemini) into the existing codebase. It is based on the current NX monorepo structure, including libs/agents (e.g., gemini-orchestrator, bq-agent), apps/agents, and libs/mcp. The goal is efficient, scalable agent orchestration with BigQuery, Firebase, and frontend/sub-agents.

## Build Order and Dependencies
Use NX's dependency graph to ensure correct build order. Run `nx graph` to visualize.

1. **Core Libraries First**:
   - Build `libs/utils/*` (e.g., gcp-auth for BigQuery clients).
   - Then `libs/agents/*` (e.g., bq-agent, gemini-orchestrator) – these depend on utils.

2. **Agent-Specific Builds**:
   - `libs/agents/gemini-orchestrator` (orchestrates sub-agents).
   - Parallel build sub-agents: bq-agent, firebase-subagent (add if needed).

3. **Apps Last**:
   - `apps/agents` and `apps/frontend-agents` – depend on all libs.

**NX Commands**:
- Full build: `nx run-many --target=build --all`.
- Affected only: `nx affected:build` (ideal for CI).
- Parallelism: Configure in `nx.json` with `"parallel": 4`.

## Reporting Order and Metrics
Follow this sequence in CI workflows (e.g., update .github/workflows/ci.yml):

1. **Unit Tests**: `nx test --all` – Focus on libs/agents specs (e.g., gemini-orchestrator.spec.ts).
2. **Integration Tests**: Extend libs/mcp/src/lib/mcp-integration.spec.ts for agent orchestration with BQ/Firebase.
3. **Coverage Reports**: `nx test --code-coverage` – Aim for 85%+; update TEST_COVERAGE_SUMMARY.md.
4. **Security Scans**: Integrate CodeQL via .github/workflows/codeql-analysis.yml for new agent code.
5. **Performance Benchmarks**: Add to .github/workflows/performance-benchmark.yml – Measure orchestration latency (<1s).

**Metrics for Success**:
- Test coverage: >85%.
- Build time: <5min for affected.
- Error rate: 0 failures in e2e agent flows (frontend query → Gemini → BQ/Firebase).

## Strategies for Integration
- **Extend Existing MCP**: Add methods to libs/agents/gemini-orchestrator/src/lib/mcp.service.ts for sub-agent routing (e.g., route to BQ or Firebase based on Gemini response).
- **Frontend Agents**: In apps/frontend-agents, add JS clients calling gemini-orchestrator via API.
- **Sub-Agents**: Modularize in libs/agents – e.g., create src/sub-agents/firebase-subagent.ts if missing.
- **Orchestration with Gemini**: Use @google/generative-ai in gemini-orchestrator.ts for tool calling (integrate BQ queries, Firebase updates).
- **NX Best Practices**:
  - Use affected commands in CI for efficiency.
  - Cache warming: Leverage .github/workflows/nx-cache-warming.yml.
  - Dependencies: Update project.json for new deps (e.g., agents depend on mcp).

## Incorporation into Current Code
- **Libs/MCP**: Extend mcp.service.ts with `orchestrate(query)` calling Gemini and sub-agents.
- **Workflow Updates**: Add agent builds to ci.yml; use bundle-size.yml to monitor frontend-agents size.
- **Testing**: Add specs for Vietnamese functionality if relevant (e.g., libs/mcp/src/lib/vietnamese-functionality.spec.ts).
- **Deployment**: After builds, deploy functions via Terraform (now updated with gemini_endpoint).

This report ensures precise, technically grounded integration. Review and run `nx test` post-changes.
