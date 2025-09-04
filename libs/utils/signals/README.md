# Signals Library

A lightweight reactive state management library for the Dulce de Saigon F&B Data Platform.

## Features

- **Primitive Signals**: Create and manage reactive state
- **Derived Signals**: Compute values based on other signals
- **React Integration**: Easy to use hooks for React components
- **Persistence**: Store signal values in localStorage
- **Async Signals**: Handle asynchronous data with loading states

## Installation

This library is part of the monorepo and can be imported directly in any project:

```typescript
import { createSignal } from '@nx-monorepo/utils/signals';
```

## Usage

### Basic Signal

```typescript
import { createSignal } from '@nx-monorepo/utils/signals';

// Create a signal with initial value
const count = createSignal(0);

// Get the current value
console.log(count.get()); // 0

// Update the value
count.set(5);
console.log(count.get()); // 5

// Subscribe to changes
const unsubscribe = count.subscribe((newValue) => {
  console.log(`Count changed to: ${newValue}`);
});

// Later, unsubscribe when no longer needed
unsubscribe();
```

### Derived Signals

```typescript
import { createSignal, derivedSignal } from '@nx-monorepo/utils/signals';

const width = createSignal(5);
const height = createSignal(10);

// Create a signal derived from other signals
const area = derivedSignal([width, height], (w, h) => w * h);

console.log(area.get()); // 50

// When a dependency changes, the derived signal updates
width.set(7);
console.log(area.get()); // 70
```

### React Integration

```tsx
import { createSignal, useSignal } from '@nx-monorepo/utils/signals';
import { useEffect } from 'react';

// Create a signal outside of components for global state
const globalCount = createSignal(0);

function Counter() {
  // Use the signal in a component
  const [count, setCount] = useSignal(globalCount);

  // Regular effects work with signals
  useEffect(() => {
    console.log(`Count in component: ${count}`);
  }, [count]);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

### Persistent Signals

```typescript
import { persistentSignal } from '@nx-monorepo/utils/signals';

// Create a signal that persists in localStorage
const theme = persistentSignal('app-theme', 'light');

// Value will be restored from localStorage on page reload
console.log(theme.get()); // 'light' or whatever was saved previously

// Updates will be saved to localStorage
theme.set('dark');
```

### Async Signals

```typescript
import { fromPromise } from '@nx-monorepo/utils/signals';

// Create a signal from a promise
const userSignal = fromPromise(fetch('/api/user').then((r) => r.json()));

// Use the signal with loading/error states
userSignal.subscribe(({ loading, data, error }) => {
  if (loading) {
    console.log('Loading user data...');
  } else if (error) {
    console.error('Failed to load user:', error);
  } else {
    console.log('User data:', data);
  }
});
```

## TypeScript Support

This library is fully typed with TypeScript, providing autocomplete and type safety.
