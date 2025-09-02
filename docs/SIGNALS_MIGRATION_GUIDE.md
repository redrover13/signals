# Signals Library Migration Guide

This guide helps you migrate from the basic signals implementation to the enhanced version.

## Key Changes

The enhanced signals library includes several improvements:

1. **Functional Updates**: Support for React-style functional updates
2. **Deep Equality Checking**: Avoid unnecessary updates
3. **Better TypeScript Types**: Improved type safety and utility types
4. **Performance Optimizations**: Memoized React hooks
5. **Debugging Improvements**: Better error handling and metadata

## Migration Steps

### Step 1: Update Imports

```typescript
// Before
import { createSignal, useSignal } from '@nx-monorepo/utils/signals';

// After - Use the enhanced version
import { createSignal, useSignal } from '@nx-monorepo/utils/signals/enhanced';
```

### Step 2: Update Signal Creation

The enhanced version supports additional options:

```typescript
// Before
const count = createSignal(0, { debug: true });

// After - More options available
const count = createSignal(0, { 
  debug: true,
  name: 'CountSignal',
  deepEqual: true, // Skip updates when values are deeply equal
  equals: (a, b) => a.id === b.id // Custom equality function
});
```

### Step 3: Update Functional Updates

The enhanced version supports functional updates:

```typescript
// Before
const count = createSignal(0);
count.set(count.get() + 1);

// After - Use functional updates
const count = createSignal(0);
count.set(prev => prev + 1);
```

### Step 4: Optimize React Component Re-Renders

```typescript
// Before - Might cause unnecessary re-renders
function Counter() {
  const [count, setCount] = useSignal(counterSignal);
  
  // This creates a new function reference on each render
  const increment = () => setCount(count + 1);
  
  return (
    <button onClick={increment}>
      Count: {count}
    </button>
  );
}

// After - Better performance
function Counter() {
  const [count, setCount] = useSignal(counterSignal);
  
  // Use functional updates for better performance
  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, [setCount]); // setCount is already memoized
  
  return (
    <button onClick={increment}>
      Count: {count}
    </button>
  );
}
```

### Step 5: Use New Type Utilities

The enhanced version provides useful type utilities:

```typescript
import { 
  createSignal, 
  SignalValue, 
  UnwrapSignal 
} from '@nx-monorepo/utils/signals/enhanced';

// Create a signal
const userSignal = createSignal({ id: 1, name: 'Test' });

// Get the value type of a signal
type User = SignalValue<typeof userSignal>; // { id: number, name: string }

// Unwrap potential signal types (useful for props)
type Props = {
  data: UnwrapSignal<typeof userSignal> | typeof userSignal;
};

// This function accepts either a signal or its value
function processUser(user: Props['data']) {
  const userData = user.__id ? user.get() : user;
  console.log(userData.name);
}
```

## Breaking Changes

1. **Equality Checking**: With `deepEqual: true`, signals won't update when values are equal
2. **Enhanced Type Checking**: Stricter type checking may reveal previously hidden type errors
3. **React Hook Behavior**: Hook implementation has been optimized and may behave slightly differently

## Next Steps

1. Update your test suite to cover the new functionality
2. Review your codebase for places where you can use functional updates
3. Optimize performance-critical code with the new options
4. Consider using the debugging features in development environments