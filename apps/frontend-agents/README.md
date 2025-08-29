# Frontend Agents

A Next.js-based frontend interface for interacting with the Dulce de Saigon F&B Data Platform agents.

## Overview

This application provides a web-based interface for users to interact with various AI agents that power the F&B data platform, including:

- **BigQuery Agent**: Query and analyze BigQuery data
- **Content Agent**: Manage and process content data
- **CRM Agent**: Customer relationship management
- **Gemini Orchestrator**: AI-powered orchestration and automation
- **Looker Agent**: Business intelligence and reporting
- **Reviews Agent**: Process and analyze customer reviews

## Features

- **Agent Selection**: Choose from available agents via an intuitive card-based interface
- **Real-time Chat**: Interactive conversation interface with each agent
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS
- **API Integration**: RESTful API endpoints for agent communication
- **Type Safety**: Full TypeScript support for robust development

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Nx
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Nx CLI

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm nx serve frontend-agents
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
pnpm nx build frontend-agents
```

## Project Structure

```
apps/frontend-agents/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── agents/[agentId]/
│   │   │       └── route.ts          # Agent API endpoints
│   │   ├── components/
│   │   │   └── AgentInterface.tsx    # Main agent chat component
│   │   ├── global.css               # Global styles with Tailwind
│   │   ├── layout.tsx               # Root layout component
│   │   └── page.tsx                 # Main page with agent selection
│   ├── next-env.d.ts
│   └── next.config.mjs
├── package.json
├── project.json
├── tailwind.config.js
└── postcss.config.js
```

## API Endpoints

### POST `/api/agents/[agentId]`

Send a query to a specific agent.

**Request Body:**
```json
{
  "query": "Your question or command",
  "params": {} // Optional parameters
}
```

**Response:**
```json
{
  "response": "Agent's response",
  "agentId": "agent-id",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "metadata": {
    "agentName": "Agent Name",
    "processingTime": 123.45
  }
}
```

### GET `/api/agents/[agentId]`

Get information about a specific agent.

**Response:**
```json
{
  "agentId": "agent-id",
  "name": "Agent Name",
  "status": "available",
  "description": "Agent description"
}
```

## Development

### Adding a New Agent

1. Add the agent to the `mockAgents` object in `/api/agents/[agentId]/route.ts`
2. Add the agent card to the main page in `page.tsx`
3. Update the agent selection logic as needed

### Customizing Styles

The application uses Tailwind CSS for styling. Custom styles can be added to `global.css` or by creating new component files.

### Environment Variables

Create a `.env.local` file for environment-specific configuration:

```env
# Add your environment variables here
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Deployment

The application is configured for deployment with Nx. Use the following commands:

```bash
# Build for production
pnpm nx build frontend-agents --configuration=production

# Serve production build
pnpm nx serve frontend-agents --configuration=production
```

## Integration with Agent Libraries

This frontend integrates with the agent libraries located in `libs/agents/`. The current implementation uses mock responses for development. To integrate with real agents:

1. Import the actual agent libraries
2. Replace mock implementations with real agent calls
3. Add proper error handling and authentication
4. Configure environment variables for agent endpoints

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for new features
3. Update this README for any new functionality
4. Test your changes thoroughly

## License

This project is part of the Dulce de Saigon F&B Data Platform and is licensed under the MIT License.
