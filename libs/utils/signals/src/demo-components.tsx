/**
 * @fileoverview Demo components for the signals library
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains React components that demonstrate signals usage.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import React from 'react';
import { createSignal, useSignal, createComputed, type Signal } from '../index';

// Create some global signals
const counterSignal = createSignal(0);
const nameSignal = createSignal('Guest');
const messageSignal = createComputed(() => `Hello, ${nameSignal()} (${counterSignal()})`);

// Counter component using signals
export function CounterDemo() {
  const [count, setCount] = useSignal(counterSignal);
  
  return (
    <div className="counter-demo">
      <h2>Counter Demo</h2>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
    </div>
  );
}

// Name input component using signals
export function NameDemo() {
  const [name, setName] = useSignal(nameSignal);
  
  return (
    <div className="name-demo">
      <h2>Name Demo</h2>
      <input 
        type="text" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Enter your name"
      />
    </div>
  );
}

// Message component using derived signal
export function MessageDemo() {
  const [message] = useSignal(messageSignal);
  
  return (
    <div className="message-demo">
      <h2>Message Demo</h2>
      <p>{message}</p>
      <p>This message automatically updates when the counter or name changes.</p>
    </div>
  );
}

// Main demo component
export function SignalsDemo() {
  return (
    <div className="signals-demo">
      <h1>Signals Demo</h1>
      <CounterDemo />
      <NameDemo />
      <MessageDemo />
    </div>
  );
}

export default SignalsDemo;
