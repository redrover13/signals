# Agent Frontend

This is the frontend application for the Dulce de Saigon Agent Platform. It provides a modern, responsive interface for interacting with AI agents.

## Features

- 🚀 Built with React 19 and TypeScript
- 📦 Vite for fast builds and development
- 🔌 Module Federation for micro-frontend architecture
- 📱 PWA support for offline capabilities
- 🧪 Jest for testing
- 📊 Performance monitoring
- 🔒 Security best practices
- ♿ Accessibility enhancements

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start the development server
pnpm nx serve agent-frontend

# Run tests
pnpm nx test agent-frontend

# Run tests with Vitest
pnpm --filter agent-frontend test:vitest

# Lint code
pnpm nx lint agent-frontend

# Build for production
pnpm nx build agent-frontend

# Analyze bundle
pnpm nx build agent-frontend --configuration=analyze

# Serve production build locally
pnpm nx serve-static agent-frontend
```

## Architecture

This application uses a modular architecture with:

- React for UI components
- TypeScript for type safety
- Module Federation for component sharing between micro-frontends
- Signal-based state management
- CSS Modules for component-scoped styling

### Key Components

- `/src/app/app.tsx` - Main application component
- `/src/app/components/` - Reusable UI components
- `/src/app/signals-demo/` - Signal-based state management demo
- `/src/app/federation-demo/` - Module Federation demo
- `/src/utils/` - Utility functions for performance, security, and accessibility

## Testing

This project uses a dual testing approach with both Jest and Vitest. For detailed information on our testing strategy, see [TESTING.md](./TESTING.md).

### Running Tests

```bash
# Run Jest tests (integrated with Nx)
pnpm --filter agent-frontend test:jest

# Run Vitest tests
pnpm --filter agent-frontend test:vitest

# Run Vitest tests in watch mode
pnpm --filter agent-frontend test:vitest:watch

# Run all tests (both Jest and Vitest)
pnpm --filter agent-frontend test:all
```

### Module Federation

This application exposes components that can be consumed by other micro-frontends:

- `/Module` - The main entry point
- `/SignalsDemo` - A demo of signal-based state management
- `/AgentInterface` - The agent interface component

It also consumes modules from the `frontend-agents` application.

## Performance Optimization

- Component memoization with React.memo
- Code splitting with lazy loading
- Bundle optimization with rollup
- Performance monitoring with the Performance API

## Security

- Input sanitization
- CSRF protection
- Content Security Policy
- XSS prevention
- HTTPS enforcement

## Accessibility

- ARIA attributes for screen readers
- Keyboard navigation support
- Focus management
- Color contrast checking

## Docker

The application can be containerized using Docker:

```bash
# Build Docker image
pnpm nx docker-build agent-frontend

# Run Docker container
docker run -p 80:80 dulcedesaigon/agent-frontend:latest
```

## CI/CD

The application is integrated with the CI/CD pipeline, which includes:

- Automated testing
- Code quality checks
- Bundle analysis
- Docker image building
- Deployment to staging and production

## License

MIT
