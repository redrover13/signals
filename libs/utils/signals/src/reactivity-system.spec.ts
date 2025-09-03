import {
  createSignal,
  createDerivedSignal,
  createEffect,
  batch,
  useSignal,
  useSignalValue,
  Signal,
} from '../index.js';

describe('Reactivity System - Advanced Patterns', () => {
  describe('Diamond Dependencies', () => {
    test('should handle diamond dependency patterns correctly', () => {
      const a = createSignal(1);
      const b = createDerivedSignal(() => a() * 2);
      const c = createDerivedSignal(() => a() * 3);
      const d = createDerivedSignal(() => b() + c());

      expect(d()).toBe(5); // (1*2) + (1*3) = 5

      a.set(2);
      expect(d()).toBe(10); // (2*2) + (2*3) = 10
    });
  });

  describe('Batch Updates', () => {
    test('should batch multiple updates efficiently', () => {
      const a = createSignal(1);
      const b = createSignal(2);
      const sum = createDerivedSignal(() => a() + b());

      let effectCount = 0;
      createEffect(() => {
        sum(); // Read to trigger dependency
        effectCount++;
      });

      expect(effectCount).toBe(1);
      expect(sum()).toBe(3);

      batch(() => {
        a.set(10);
        b.set(20);
      });

      expect(sum()).toBe(30);
      expect(effectCount).toBe(2); // Should only run once after batch
    });

    test('should handle nested batch operations', () => {
      const a = createSignal(1);
      const b = createSignal(2);
      const sum = createDerivedSignal(() => a() + b());

      let effectCount = 0;
      createEffect(() => {
        sum();
        effectCount++;
      });

      expect(effectCount).toBe(1);

      batch(() => {
        a.set(5);
        batch(() => {
          b.set(10);
        });
        a.set(15);
      });

      expect(sum()).toBe(25); // 15 + 10
      expect(effectCount).toBe(2); // Should only run once after all batches complete
    });
  });

  describe('Memory Management', () => {
    test('should clean up effects when disposed', () => {
      const signal = createSignal(0);
      let effectRuns = 0;

      const dispose = createEffect(() => {
        signal();
        effectRuns++;
      });

      expect(effectRuns).toBe(1);

      signal.set(1);
      expect(effectRuns).toBe(2);

      dispose();

      signal.set(2);
      expect(effectRuns).toBe(2); // Should not run after disposal
    });

    test('should handle circular dependencies gracefully', () => {
      const a = createSignal(1);
      const b = createDerivedSignal(() => a() + 1);
      const c = createDerivedSignal(() => b() * 2);

      // Create a circular reference (this should be handled gracefully)
      let circularRuns = 0;
      const dispose = createEffect(() => {
        circularRuns++;
        if (a() < 5) {
          a.set(a() + 1);
        }
      });

      expect(circularRuns).toBe(5); // Should run 5 times then stop
      expect(a()).toBe(5);
      expect(b()).toBe(6);
      expect(c()).toBe(12);

      dispose();
    });
  });

  describe('React Integration', () => {
    test('should work with React hooks', () => {
      const signal = createSignal('test');

      // Simulate React hook usage
      const [value, setValue] = useSignal(signal);
      expect(value).toBe('test');

      setValue('updated');
      expect(signal()).toBe('updated');
      expect(useSignalValue(signal)).toBe('updated');
    });

    test('should handle function updates in React hooks', () => {
      const counter = createSignal(0);
      const [, setCounter] = useSignal(counter);

      setCounter(prev => prev + 1);
      expect(counter()).toBe(1);

      setCounter(prev => prev * 2);
      expect(counter()).toBe(2);
    });
  });

  describe('Performance Optimizations', () => {
    test('should avoid unnecessary recalculations', () => {
      const a = createSignal(1);
      const b = createSignal(2);
      const sum = createDerivedSignal(() => {
        console.log('Computing sum');
        return a() + b();
      });

      // First access should compute
      expect(sum()).toBe(3);

      // Second access should not recompute
      expect(sum()).toBe(3);

      // Only when dependencies change should it recompute
      a.set(10);
      expect(sum()).toBe(12);
    });

    test('should handle large dependency chains efficiently', () => {
      const signals: Signal<number>[] = [];
      const derivedSignals: Signal<number>[] = [];

      // Create a chain of 100 signals
      for (let i = 0; i < 100; i++) {
        signals.push(createSignal(i));
      }

      // Create derived signals that depend on previous ones
      for (let i = 0; i < 99; i++) {
        derivedSignals.push(createDerivedSignal(() => signals[i]() + signals[i + 1]()));
      }

      // Verify the chain works
      expect(derivedSignals[0]()).toBe(0 + 1);
      expect(derivedSignals[50]()).toBe(50 + 51);

      // Update a signal and verify propagation
      signals[0].set(100);
      expect(derivedSignals[0]()).toBe(100 + 1);
    });
  });

  describe('Error Handling', () => {
    test('should handle errors in effects gracefully', () => {
      const signal = createSignal(1);
      let errorCaught = false;

      const dispose = createEffect(() => {
        if (signal() === 2) {
          throw new Error('Test error');
        }
      });

      // This should not crash the system
      expect(() => {
        signal.set(2);
      }).not.toThrow();

      dispose();
    });

    test('should handle errors in derived signals', () => {
      const signal = createSignal(1);
      const derived = createDerivedSignal(() => {
        if (signal() === 2) {
          throw new Error('Derived error');
        }
        return signal() * 2;
      });

      expect(derived()).toBe(2);

      // Error in derived should not crash
      expect(() => {
        signal.set(2);
      }).not.toThrow();

      // Should maintain last valid value or handle error gracefully
      expect(derived()).toBe(2); // Should keep previous value
    });
  });

  describe('Complex State Management', () => {
    test('should handle complex object updates', () => {
      interface User {
        name: string;
        age: number;
        preferences: { theme: string; notifications: boolean };
      }

      const user = createSignal<User>({
        name: 'John',
        age: 25,
        preferences: { theme: 'light', notifications: true }
      });

      const displayName = createDerivedSignal(() => `${user().name} (${user().age})`);
      const theme = createDerivedSignal(() => user().preferences.theme);

      expect(displayName()).toBe('John (25)');
      expect(theme()).toBe('light');

      user.set({
        ...user(),
        name: 'Jane',
        preferences: { ...user().preferences, theme: 'dark' }
      });

      expect(displayName()).toBe('Jane (25)');
      expect(theme()).toBe('dark');
    });

    test('should handle array operations', () => {
      const todos = createSignal<string[]>(['Learn React', 'Learn Signals']);
      const todoCount = createDerivedSignal(() => todos().length);
      const completedTodos = createSignal<string[]>([]);

      expect(todoCount()).toBe(2);

      todos.set([...todos(), 'Learn TypeScript']);
      expect(todoCount()).toBe(3);

      completedTodos.set([...completedTodos(), todos()[0]]);
      expect(completedTodos()).toEqual(['Learn React']);
    });
  });

  describe('Async Operations', () => {
    test('should handle async derived signals', async () => {
      const id = createSignal(1);
      const userData = createDerivedSignal(async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 10));
        return { id: id(), name: `User ${id()}` };
      });

      // Initial value should be pending or have a default
      expect(userData()).toBeDefined();

      id.set(2);
      // Should trigger new async computation
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(userData().id).toBe(2);
    });
  });
});
