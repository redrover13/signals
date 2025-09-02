# React with Signals Architecture Guide

## Overview

This guide explains how to implement and use signals for state management in React applications within the Dulce de Saigon F&B Data Platform.

## Core Concepts

### Signal-based Architecture

Signals provide several advantages over traditional state management:

1. **Fine-grained Reactivity**: Components only re-render when the specific signals they use change
2. **Separation of Concerns**: State definition is decoupled from component rendering
3. **Predictable Updates**: State updates follow a clear, synchronous pattern
4. **Type Safety**: Full TypeScript support for all operations

## Implementation Patterns

### Module-level State

For state that needs to be shared across components within a module:

```tsx
// userState.ts
import { createSignal } from '@nx-monorepo/utils/signals';

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'user';
}

// Create signals at module level
export const userSignal = createSignal<User | null>(null);
export const isAuthenticatedSignal = createSignal(false);

// Actions
export function login(userData: User): void {
  userSignal.set(userData);
  isAuthenticatedSignal.set(true);
}

export function logout(): void {
  userSignal.set(null);
  isAuthenticatedSignal.set(false);
}
```

### Component Usage

```tsx
// UserProfile.tsx
import { useSignal } from '@nx-monorepo/utils/signals';
import { userSignal, logout } from './userState';

export function UserProfile() {
  const [user] = useSignal(userSignal);
  
  if (!user) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <h2>Welcome, {user.name}</h2>
      <p>Role: {user.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Composition Patterns

### Derived State

For computed values based on other signals:

```tsx
// cartState.ts
import { createSignal, createComputed } from '@nx-monorepo/utils/signals';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export const cartItemsSignal = createSignal<CartItem[]>([]);

// Derived signals are automatically updated when dependencies change
export const cartTotalSignal = createComputed(() => {
  const items = cartItemsSignal.get();
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

export const cartCountSignal = createComputed(() => {
  return cartItemsSignal.get().length;
});

// Actions
export function addToCart(item: CartItem): void {
  const currentItems = cartItemsSignal.get();
  const existingItemIndex = currentItems.findIndex(i => i.id === item.id);
  
  if (existingItemIndex >= 0) {
    // Update quantity if item exists
    const newItems = [...currentItems];
    newItems[existingItemIndex] = {
      ...newItems[existingItemIndex],
      quantity: newItems[existingItemIndex].quantity + 1
    };
    cartItemsSignal.set(newItems);
  } else {
    // Add new item
    cartItemsSignal.set([...currentItems, { ...item, quantity: 1 }]);
  }
}
```

### Async Data Fetching

For handling API requests:

```tsx
// productState.ts
import { createSignal, fromPromise } from '@nx-monorepo/utils/signals';
import { fetchProducts } from '../api/products';

// Create an async signal from a promise
export const productsSignal = fromPromise(fetchProducts());

// Component usage
function ProductList() {
  const [productState] = useSignal(productsSignal);
  
  if (productState.loading) {
    return <div>Loading products...</div>;
  }
  
  if (productState.error) {
    return <div>Error: {productState.error.message}</div>;
  }
  
  return (
    <div>
      <h2>Products</h2>
      <ul>
        {productState.data?.map(product => (
          <li key={product.id}>{product.name} - ${product.price}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Performance Considerations

### Memoization

For expensive computations, consider using memoization:

```tsx
import { createSignal, createComputed } from '@nx-monorepo/utils/signals';
import { memoize } from 'lodash';

const itemsSignal = createSignal([/* large dataset */]);

// Memoize the expensive filter function
const expensiveFilter = memoize(
  (items, searchTerm) => items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
);

// Create a computed signal that uses the memoized function
export const filteredItemsSignal = (searchTerm: string) => 
  createComputed(() => expensiveFilter(itemsSignal.get(), searchTerm));
```

### Component Optimization

Ensure components only access the signals they need:

```tsx
// Bad: Will re-render when any user property changes
function UserGreeting() {
  const [user] = useSignal(userSignal);
  return <h2>Welcome, {user.name}</h2>;
}

// Better: Only re-renders when the name changes
function UserGreeting() {
  const [userName] = useSignal(createComputed(() => userSignal.get().name));
  return <h2>Welcome, {userName}</h2>;
}
```

## Integration with Nx

### Module Federation

Signals work seamlessly with module federation:

```js
// module-federation.config.js
module.exports = {
  // ... other config
  shared: {
    // Share the signals library as a singleton
    "@nx-monorepo/utils/signals": {
      singleton: true,
      eager: true,
      requiredVersion: false,
    },
  }
};
```

## Best Practices

1. **Signal Granularity**: Create signals at the right level of granularity
2. **Colocate Related Signals**: Keep related signals in the same module
3. **Consistent Naming**: Use a consistent naming convention like `nameSignal`
4. **Expose Actions**: Define clear functions for updating signals
5. **Type Everything**: Leverage TypeScript for type safety

## Testing Signals

```tsx
// userState.test.ts
import { userSignal, isAuthenticatedSignal, login, logout } from './userState';

describe('User State', () => {
  beforeEach(() => {
    // Reset signals to initial state
    userSignal.set(null);
    isAuthenticatedSignal.set(false);
  });
  
  test('login should update user and authentication state', () => {
    const testUser = { id: '123', name: 'Test User', role: 'user' as const };
    
    login(testUser);
    
    expect(userSignal.get()).toEqual(testUser);
    expect(isAuthenticatedSignal.get()).toBe(true);
  });
  
  test('logout should clear user and authentication state', () => {
    const testUser = { id: '123', name: 'Test User', role: 'user' as const };
    
    login(testUser);
    logout();
    
    expect(userSignal.get()).toBeNull();
    expect(isAuthenticatedSignal.get()).toBe(false);
  });
});
```