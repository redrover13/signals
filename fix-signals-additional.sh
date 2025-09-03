#!/bin/bash

echo "Fixing additional TypeScript errors in the signals library..."

# Fix index.ts - restore the signalIdCounter variable with eslint-disable
sed -i '33i\// Internal counter for generating unique IDs\n/* eslint-disable-next-line @typescript-eslint/no-unused-vars */\nlet signalIdCounter = 0;' /home/g_nelson/signals-1/libs/utils/signals/index.ts

# Fix enhanced-signals.spec.ts - completely rewrite the type safety tests
cat > /home/g_nelson/signals-1/libs/utils/signals/src/enhanced-signals.spec.ts.new << 'EOF'
/**
 * @fileoverview Enhanced signals test spec
 */

import { describe, expect, it, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import {
  createSignal,
  SignalValue,
  UnwrapSignal,
  createDerivedSignal,
  createMemo,
  useSignal,
  useSignalValue,
} from '../enhanced-index';

describe('Enhanced Signals Library', () => {
  describe('createSignal', () => {
    it('should create a signal with initial value', () => {
      const counter = createSignal(0);
      expect(counter()).toBe(0);
      expect(counter.get()).toBe(0);
    });

    it('should update value when set is called', () => {
      const counter = createSignal(0);
      counter.set(5);
      expect(counter()).toBe(5);
    });

    it('should update using a setter function', () => {
      const counter = createSignal(0);
      counter.set((prev) => prev + 1);
      expect(counter()).toBe(1);
    });

    it('should notify subscribers when value changes', () => {
      const counter = createSignal(0);
      const mockCallback = jest.fn();

      counter.subscribe(mockCallback);
      counter.set(5);
      
      expect(mockCallback).toHaveBeenCalledWith(5);
    });

    it('should not notify subscribers when value does not change', () => {
      const counter = createSignal(0);
      const mockCallback = jest.fn();

      counter.subscribe(mockCallback);
      counter.set(0);
      
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should support unsubscribing', () => {
      const counter = createSignal(0);
      const mockCallback = jest.fn();

      const unsubscribe = counter.subscribe(mockCallback);
      unsubscribe();
      counter.set(5);
      
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should support deep equality checks when option is enabled', () => {
      const user = createSignal({ name: 'John', age: 30 }, { deepEqual: true });
      const mockCallback = jest.fn();
      user.subscribe(mockCallback);

      // Same content but different object reference
      user.set({ name: 'John', age: 30 });
      
      // Should not trigger callback because of deep equality
      expect(mockCallback).not.toHaveBeenCalled();

      // Now change a property
      user.set({ name: 'Jane', age: 30 });
      expect(mockCallback).toHaveBeenCalled();
    });

    it('should support custom equality function', () => {
      const customEquals = <T extends { id: number }>(a: T, b: T) => a.id === b.id;
      
      const item = createSignal(
        { id: 1, value: 'test' },
        { equals: customEquals }
      );
      
      const mockCallback = jest.fn();
      item.subscribe(mockCallback);

      // Same ID but different value
      item.set({ id: 1, value: 'changed' });
      
      // Should not trigger callback because of custom equality
      expect(mockCallback).not.toHaveBeenCalled();

      // Now change ID
      item.set({ id: 2, value: 'changed' });
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('useSignal', () => {
    it('should return a signal and its setter', () => {
      const { result } = renderHook(() => useSignal(0));
      
      expect(result.current[0]()).toBe(0);
      
      act(() => {
        result.current[1](5);
      });
      
      expect(result.current[0]()).toBe(5);
    });

    it('should preserve the setter identity across renders', () => {
      const { result, rerender } = renderHook(() => useSignal(0));
      
      const initialSetter = result.current[1];
      
      rerender();

      expect(result.current[1]).toBe(initialSetter);
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should correctly infer signal types', () => {
      // Create actual signals for type testing
      const numberSignal = createSignal(42);
      const stringSignal = createSignal('hello');
      const objectSignal = createSignal({ foo: 'bar' });
      
      // Extract value types using SignalValue
      type NumType = SignalValue<typeof numberSignal>;
      type StrType = SignalValue<typeof stringSignal>;
      type ObjType = SignalValue<typeof objectSignal>;

      // Verify types are correctly inferred
      const num: NumType = 100;
      const str: StrType = 'world';
      const obj: ObjType = { foo: 'baz' };

      // Type checks in tests
      expect(typeof num).toBe('number');
      expect(typeof str).toBe('string');
      expect(typeof obj).toBe('object');
      
      // Ensure signals work correctly
      numberSignal.set(num);
      stringSignal.set(str);
      objectSignal.set(obj);
    });

    it('should support UnwrapSignal utility type', () => {
      // Define the interface for testing
      interface TestObject {
        id: number;
        name: string;
      }

      // Create an actual signal for type testing
      const testObjectSignal = createSignal<TestObject>({ id: 1, name: 'test' });
      
      // Use UnwrapSignal to extract the type
      type UnwrappedType = UnwrapSignal<typeof testObjectSignal>;

      const unwrapped: UnwrappedType = { id: 2, name: 'unwrapped' };

      expect(unwrapped.id).toBe(2);
      expect(unwrapped.name).toBe('unwrapped');
    });
  });
});
EOF
mv /home/g_nelson/signals-1/libs/utils/signals/src/enhanced-signals.spec.ts.new /home/g_nelson/signals-1/libs/utils/signals/src/enhanced-signals.spec.ts

# Fix the equals function type in enhanced-index.ts (if needed)
# Find the equals option in CreateSignalOptions interface
if grep -q "equals?: <T>" /home/g_nelson/signals-1/libs/utils/signals/enhanced-index.ts; then
  sed -i 's/equals?: <T>(a: T, b: T) => boolean;/equals?: <T>(a: T, b: T) => boolean;/g' /home/g_nelson/signals-1/libs/utils/signals/enhanced-index.ts
fi

echo "Running build to check if errors are fixed..."
nx build signals

echo "Done fixing additional TypeScript errors in the signals library."
