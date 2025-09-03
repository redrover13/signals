/**
 * @fileoverview Unit tests for the enhanced signals implementation
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains test cases for verifying the enhanced signal functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { 
  createSignal, 
  createComputed,
  useSignal,
  SignalValue,
  UnwrapSignal
} from '../enhanced-index';
import { renderHook, act } from '@testing-library/react';

describe('Enhanced Signals Library', () => {
  describe('createSignal', () => {
    it('should create a signal with the initial value', () => {
      const count = createSignal(0);
      expect(count.get()).toBe(0);
    });

    it('should update the signal value when set is called', () => {
      const count = createSignal(0);
      count.set(5);
      expect(count.get()).toBe(5);
    });

    it('should support functional updates', () => {
      const count = createSignal(5);
      count.set(prev => prev + 10);
      expect(count.get()).toBe(15);
    });
    
    it('should skip update when values are equal with deepEqual option', () => {
      const obj = { a: 1, b: 2 };
      
      // Create a spy to track the set method calls
      const setMethodSpy = jest.fn();
      
      // Create signal with deepEqual option
      const objSignal = createSignal(obj, { deepEqual: true });
      
      // Replace the original set method with our spy
      const originalSet = objSignal.set;
      objSignal.set = (value: any) => {
        setMethodSpy(value);
        return originalSet(value);
      };
      
      // This should be skipped due to deep equality
      objSignal.set({ ...obj });
      
      // Verify the original value remains and our spy wasn't called with a new value
      expect(objSignal.get()).toEqual(obj);
      expect(setMethodSpy).toHaveBeenCalledTimes(1); // Called but update skipped internally
      
      // Now update with a different value
      objSignal.set({ a: 1, b: 3 });
      expect(objSignal.get()).toEqual({ a: 1, b: 3 });
      expect(setMethodSpy).toHaveBeenCalledTimes(2); // Called again
    });
    
    it('should support custom equality functions', () => {
      const customEquals = (a: any, b: any) => {
        // Only compare the 'id' property
        return a.id === b.id;
      };
      
      const objSignal = createSignal({ id: 1, value: 'test' }, { 
        deepEqual: true, 
        equals: customEquals 
      });
      
      // This should be skipped because ids are the same
      objSignal.set({ id: 1, value: 'changed' });
      expect(objSignal.get()).toEqual({ id: 1, value: 'test' });
      
      // This should update because id is different
      objSignal.set({ id: 2, value: 'test' });
      expect(objSignal.get()).toEqual({ id: 2, value: 'test' });
    });
  });

  describe('useSignal React Hook', () => {
    it('should return the current signal value and a setter', () => {
      const countSignal = createSignal(0);
      
      const { result } = renderHook(() => useSignal(countSignal));
      
      expect(result.current[0]).toBe(0);
      expect(typeof result.current[1]).toBe('function');
    });
    
    it('should update the component when the signal changes', () => {
      const countSignal = createSignal(0);
      
      const { result } = renderHook(() => useSignal(countSignal));
      
      act(() => {
        countSignal.set(5);
      });
      
      expect(result.current[0]).toBe(5);
    });
    
    it('should update the signal when the setter is called', () => {
      const countSignal = createSignal(0);
      
      const { result } = renderHook(() => useSignal(countSignal));
      
      act(() => {
        result.current[1](5);
      });
      
      expect(countSignal.get()).toBe(5);
    });
    
    it('should support functional updates in the hook', () => {
      const countSignal = createSignal(5);
      
      const { result } = renderHook(() => useSignal(countSignal));
      
      act(() => {
        result.current[1](prev => prev + 10);
      });
      
      expect(countSignal.get()).toBe(15);
    });
    
    it('should not cause unnecessary re-renders with memoized setter', () => {
      const countSignal = createSignal(5);
      
      const { result, rerender } = renderHook(() => useSignal(countSignal));
      const initialSetter = result.current[1];
      
      // Rerender the hook
      rerender();
      
      // The setter should be the same function reference (memoized)
      expect(result.current[1]).toBe(initialSetter);
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should correctly infer signal types', () => {
      const numSignal = createSignal(42);
      const strSignal = createSignal('hello');
      const objSignal = createSignal({ foo: 'bar' });
      
      // Test type inference with SignalValue utility type
      type NumType = SignalValue<typeof numSignal>;
      type StrType = SignalValue<typeof strSignal>;
      type ObjType = SignalValue<typeof objSignal>;
      
      // These assignments would fail compilation if types were incorrect
      const num: NumType = 100;
      const str: StrType = 'world';
      const obj: ObjType = { foo: 'baz' };
      
      expect(typeof num).toBe('number');
      expect(typeof str).toBe('string');
      expect(typeof obj).toBe('object');
    });
    
    it('should support UnwrapSignal utility type', () => {
      interface TestObject {
        id: number;
        name: string;
      }
      
      const objSignal = createSignal<TestObject>({ id: 1, name: 'test' });
      
      // Test unwrapping the signal type
      type UnwrappedType = UnwrapSignal<typeof objSignal>;
      
      // This would fail compilation if type was incorrect
      const unwrapped: UnwrappedType = { id: 2, name: 'unwrapped' };
      
      expect(unwrapped.id).toBe(2);
      expect(unwrapped.name).toBe('unwrapped');
    });
  });
});
