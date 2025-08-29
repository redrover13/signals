# Signals Library PR

## Overview

This PR introduces a new reactive state management library called "Signals" to the Dulce de Saigon F&B Data Platform. Signals provide a lightweight, type-safe way to manage state across components and modules with automatic dependency tracking and updates.

## Features

- **Primitive Signals**: Simple containers for reactive values
- **Derived Signals**: Computed values that update automatically
- **React Hooks**: Easy integration with React components
- **Persistence**: Built-in localStorage integration
- **Async Support**: Handle asynchronous data with loading states
- **Nx/Redux Integration**: Connect signals to existing state management

## Implementation Details

The implementation follows a simple observer pattern:
- Signals maintain a list of subscribers
- When a signal's value changes, all subscribers are notified
- Derived signals subscribe to their dependencies and recalculate automatically
- React components efficiently re-render when signal values change

## Files Added

- `/libs/utils/signals/index.ts` - Main library implementation
- `/libs/utils/signals/src/nx-integration.ts` - Integration with Nx/Redux
- `/libs/utils/signals/src/demo-components.tsx` - Example React components
- `/libs/utils/signals/src/signals.spec.ts` - Unit tests
- `/agent-frontend/src/app/with-signals.tsx` - Integration example
- `/docs/signals-implementation-guide.md` - Documentation

## Usage Example

```typescript
// Create a signal
const count = createSignal(0);

// Create a derived signal
const doubled = derivedSignal([count], c => c * 2);

// Use in a React component
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

## Testing

The library includes comprehensive unit tests covering:
- Basic signal functionality
- Derived signals
- React hook integration
- Persistence
- Async signals

## How to Use

1. Import the library:
   ```typescript
   import { createSignal, useSignal } from '@nx-monorepo/utils/signals';
   ```

2. Create signals:
   ```typescript
   // At module level for shared state
   const userSignal = createSignal({ name: 'Guest', isLoggedIn: false });
   ```

3. Use in components:
   ```typescript
   function UserGreeting() {
     const [user] = useSignal(userSignal);
     return <h1>Hello, {user.name}!</h1>;
   }
   ```

4. To try the demo:
   ```bash
   pnpm run signals:demo
   ```

## Next Steps

- Add middleware support for logging and debugging
- Create DevTools for signal inspection
- Add more persistence adapters
- Integrate with GCP services for distributed signals

## Related Issues

- #123 Need for lightweight state management
- #456 Improving component performance
