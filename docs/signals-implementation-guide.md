# Signals Implementation Guide

## Overview

The Signals library is a lightweight, type-safe reactive state management solution for the Dulce de Saigon F&B Data Platform. It provides a simple API for creating, deriving, and subscribing to reactive values that automatically update when their dependencies change.

## Core Concepts

### Signal

A Signal is a container for a value that can notify subscribers when it changes. This is the fundamental building block of the library.

```typescript
const count = createSignal(0); // Create with initial value
count.get(); // Read the value
count.set(5); // Update the value
count.subscribe(value => console.log(value)); // React to changes
```

### Derived Signal

A Derived Signal computes its value based on other signals. It automatically updates when any of its dependencies change.

```typescript
const width = createSignal(5);
const height = createSignal(10);
const area = derivedSignal([width, height], (w, h) => w * h);
```

### React Integration

The library provides React hooks for using signals in components:

```typescript
function Counter() {
  const [count, setCount] = useSignal(counterSignal);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

## Architecture

### Signal Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Raw Signal │     │   Derived   │     │  Component  │
│    Data     │────▶│   Signal    │────▶│    State    │
└─────────────┘     └─────────────┘     └─────────────┘
       ▲                                       │
       │                                       │
       └───────────────────────────────────────┘
                     Updates
```

### Implementation Details

The signals implementation uses a simple observer pattern:

1. Signals maintain a list of subscribers (callbacks)
2. When a signal's value changes, all subscribers are notified
3. Derived signals subscribe to their dependencies and recalculate when needed
4. React components use the `useSignal` hook to efficiently re-render

## Integration with Nx

### Project Structure

```
libs/
  utils/
    signals/
      index.ts           # Main exports
      src/
        nx-integration.ts    # Integration with Nx/NgRx
        demo-components.tsx  # Example React components
        signals.spec.ts      # Unit tests
      project.json       # Nx project configuration
      tsconfig.json      # TypeScript configuration
      README.md          # Documentation
```

### Using in Other Projects

```typescript
// Import the library
import { createSignal, useSignal } from '@nx-monorepo/utils/signals';

// Create signals at module level for shared state
const globalState = createSignal({ count: 0, user: null });

// Use in components
function MyComponent() {
  const [state, setState] = useSignal(globalState);
  
  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => setState({ ...state, count: state.count + 1 })}>
        Increment
      </button>
    </div>
  );
}
```

## Performance Considerations

### Memoization

The library doesn't implement automatic memoization, so be careful when using derived signals with expensive computations. Consider memoizing the derivation function manually if needed.

### React Performance

When using signals with React, the `useSignal` hook ensures that components only re-render when the specific signal values they use change. This can lead to better performance compared to context-based state management where components might re-render unnecessarily.

## Best Practices

1. **Signal Granularity**: Create signals at the right level of granularity. Too fine-grained and you'll have too many signals to manage; too coarse and you'll cause unnecessary re-renders.

2. **Prefer Composition**: Compose complex state from simpler signals using derived signals.

3. **Signal Ownership**: Define signals close to where they're used. For global state, create a dedicated module.

4. **TypeScript Integration**: Leverage TypeScript for type safety in your signals.

5. **Testing**: Test signals in isolation from UI components when possible.

## Future Enhancements

1. **Batched Updates**: Enhance the `batch` function to truly batch updates and reduce redundant notifications.

2. **Middleware Support**: Add middleware for logging, debugging, and other cross-cutting concerns.

3. **DevTools Integration**: Create DevTools for inspecting and manipulating signals during development.

4. **Persistence Adapters**: Add more adapters for different storage mechanisms beyond localStorage.

5. **Framework Integrations**: Add integrations for other frameworks beyond React.

## Migration Guide

If you're migrating from other state management solutions:

### From React Context

```typescript
// Before
const CountContext = createContext({ count: 0, setCount: () => {} });

// After
const countSignal = createSignal(0);

// Before
function useCount() {
  return useContext(CountContext);
}

// After
function useCount() {
  return useSignal(countSignal);
}
```

### From Redux/NgRx

Use the Nx integration utilities:

```typescript
import { signalFromStore, connectSignalToStore } from '@nx-monorepo/utils/signals/src/nx-integration';

// Create a read-only signal from a store slice
const countSignal = signalFromStore(store, state => state.counter.value);

// Create a two-way binding
const countWithUpdates = connectSignalToStore(
  store,
  state => state.counter.value,
  value => ({ type: 'SET_COUNT', payload: value })
);
```
