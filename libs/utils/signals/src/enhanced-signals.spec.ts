/**
 * @fileoverview Enhanced signals test spec
 */

import { createSignal, SignalValue, UnwrapSignal } from "../enhanced-index.js"';

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

      // Assuming deepEqual implementation works correctly
      expect(mockCallback).not.toHaveBeenCalled();
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
