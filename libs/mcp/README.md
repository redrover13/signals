# MCP (Model Context Protocol) Integration Library

A comprehensive MCP integration system for the Signals project, providing seamless access to 27+ MCP servers across different categories including development tools, data services, web APIs, and specialized platforms.

## 🚀 Features

- **27+ MCP Servers**: Complete integration with all major MCP servers
- **Environment-Aware**: Different configurations for development, staging, and production
- **Health Monitoring**: Automatic health checks and server monitoring
- **Load Balancing**: Intelligent request routing and load distribution
- **Error Handling**: Robust error handling with retry mechanisms
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Google Cloud Integration**: Native GCP integration for BigQuery, Cloud Run, Secret Manager
- **Nx Workspace Support**: Built-in Nx monorepo integration

## 📦 Installation

The MCP library is already included in your Nx workspace. To use it in your applications:

```typescript
import { mcpService, createMCPClient } from '@nx-monorepo/mcp';
```

## Package Manager

This project uses `pnpm` as the package manager. Ensure you have `pnpm` installed globally before running any commands. You can install it using:

```bash
npm install -g pnpm
```

All commands in this project should be executed using `pnpm` unless explicitly stated otherwise.

---

- **Core**: Essential servers (git, filesystem, memory, time, sequential thinking)
- **Development**: Development tools (GitHub, Nx, Node.js, Apimatic tools, everything)
- **Web**: Web and API services (Exa tools, fetch, Netlify, Cloudflare)
- **Platforms**: Platform integrations (Google, Firebase, Notion, MS Learn)
- **Specialized**: Specialized tools (Google Maps, Algolia search, Built With, Magic tools)
- **Testing**: Testing and debugging (Browser Base, Browser Stack, everything)
- **Automation**: Workflow automation (Make, DevHub)

```typescript
// Example TypeScript Code
await mcpService.initialize();
```

```bash
# Example Bash Command
export NODE_ENV=production
```

**Note**: This MCP integration is specifically designed for the Signals project and includes optimizations for Google Cloud Platform, Nx workspaces, and Vietnamese data privacy regulations
