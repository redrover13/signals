# Best Practices

This document outlines the best practices for developing in this monorepo.

## ESM

- All new code should be written in ESM.
- Use `import` and `export` statements.
- Avoid `require` and `module.exports`.

## Nx

- Use `nx affected` to run commands only on affected projects.
- Use the Nx graph to visualize project dependencies.

## MCP

- Use the MCP to interact with external services.
- Add new MCP servers to the `enhanced-mcp.json` file.

## Testing

- Write unit tests for all new code.
- Use the `/unit-test` command to generate unit tests for newly migrated modules.
