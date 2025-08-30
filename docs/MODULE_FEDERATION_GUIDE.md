# Module Federation Configuration Guide

This guide explains how to use and configure Module Federation in the Dulce de Saigon F&B Data Platform.

## Overview

Module Federation allows us to build a micro-frontend architecture where multiple independently deployable applications can work together in a seamless user experience. We use Webpack 5's Module Federation plugin to share code between applications.

## Architecture

Our module federation architecture follows this pattern:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Shell (Host)   │◄────┤  Remote App 1   │     │  Remote App 2   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ▲                       ▲                       ▲
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │                 │
                    │  Shared Library │
                    │                 │
                    └─────────────────┘
```

- **Shell**: The container application that hosts other micro-frontends
- **Remote Apps**: Independently deployable applications
- **Shared Libraries**: Common code shared between applications

## Configuration

### Shell Application Configuration

The shell application (host) is configured in `module-federation.config.cjs`:

```javascript
const { withModuleFederation } = require('@nx/angular/module-federation');

module.exports = withModuleFederation({
  name: 'shell',
  remotes: [
    ['agent-frontend', 'http://localhost:4201/remoteEntry.js'],
    ['analytics-dashboard', 'http://localhost:4202/remoteEntry.js']
  ],
  shared: {
    '@angular/core': { singleton: true },
    '@angular/common': { singleton: true },
    '@angular/router': { singleton: true },
    '@dulce-de-saigon/ui-components': { singleton: true }
  }
});
```

### Remote Application Configuration

Each remote application is configured in its own `module-federation.config.cjs`:

```javascript
const { withModuleFederation } = require('@nx/angular/module-federation');

module.exports = withModuleFederation({
  name: 'agent-frontend',
  exposes: {
    './Module': './src/app/remote-entry/entry.module.ts',
    './Component': './src/app/components/agent-panel/agent-panel.component.ts'
  },
  shared: {
    '@angular/core': { singleton: true },
    '@angular/common': { singleton: true },
    '@angular/router': { singleton: true },
    '@dulce-de-saigon/ui-components': { singleton: true }
  }
});
```

## Deployment Considerations

### Dynamic Remote URLs

In production, we use dynamic remote URLs:

```javascript
// Dynamically load remotes based on environment
const getRemoteEntryUrl = (remoteName) => {
  const REMOTE_URL_MAP = {
    development: {
      'agent-frontend': 'http://localhost:4201/remoteEntry.js',
      'analytics-dashboard': 'http://localhost:4202/remoteEntry.js'
    },
    production: {
      'agent-frontend': 'https://agents.dulce-de-saigon.com/remoteEntry.js',
      'analytics-dashboard': 'https://analytics.dulce-de-saigon.com/remoteEntry.js'
    }
  };
  
  return REMOTE_URL_MAP[process.env.NODE_ENV][remoteName];
};
```

### Versioning Strategy

To handle versioning between remotes and the shell:

1. **Semantic Versioning**: All apps should follow semantic versioning
2. **Version Compatibility**: Shell should define compatible versions for remotes
3. **Fallback Mechanism**: Implement fallbacks for incompatible versions

## Best Practices

1. **Minimize Shared Dependencies**: Only share what's necessary
2. **Contract Testing**: Test the integration between host and remotes
3. **Error Boundaries**: Implement error boundaries for each remote
4. **Lazy Loading**: Load remotes lazily when needed
5. **Design System**: Use a shared design system across all apps

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Version mismatch | Ensure shared libraries have matching versions |
| Loading failures | Implement retry mechanisms and fallbacks |
| Styling conflicts | Use CSS modules or scoped styles |
| Performance issues | Optimize bundle sizes and implement code splitting |

## Testing Module Federation

### Unit Testing

Each remote and the shell should have their own unit tests:

```javascript
// Example test for a remote component
describe('AgentPanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgentPanelComponent],
      imports: [SharedModule]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AgentPanelComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
```

### Integration Testing

Test the integration between the shell and remotes:

```javascript
// Example integration test
describe('Shell with Agent Frontend', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShellModule]
    }).compileComponents();
  });

  it('should load the agent frontend', async () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    
    // Wait for remote to load
    await fixture.whenStable();
    
    const agentElement = fixture.nativeElement.querySelector('agent-panel');
    expect(agentElement).toBeTruthy();
  });
});
```

## Additional Resources

- [Webpack Module Federation Documentation](https://webpack.js.org/concepts/module-federation/)
- [Nx Module Federation Documentation](https://nx.dev/module-federation/overview)
- [Angular Architecture with Module Federation](https://www.angulararchitects.io/aktuelles/the-microfrontend-revolution-part-2-module-federation-with-angular/)
