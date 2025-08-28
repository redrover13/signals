/**
 * @fileoverview demo-components module for the src component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import React from 'react';
import { createSignal, useSignal, derivedSignal } from '../index';

// Create some global signals
const counterSignal = createSignal(0);
const userNameSignal = createSignal('Guest');
const isLoggedInSignal = createSignal(false);

// Create a derived signal
const welcomeMessageSignal = derivedSignal(
  [userNameSignal, isLoggedInSignal],
  (name, isLoggedIn) => isLoggedIn 
    ? `Welcome back, ${name}!` 
    : `Hello, ${name}. Please log in.`
);

/**
 * Counter component using signals
 */
export const Counter: React.FC = () => {
  const [count, setCount] = useSignal(counterSignal);
  
  return (
    <div className="counter">
      <h2>Counter: {count}</h2>
      <div className="counter-controls">
        <button onClick={() => setCount(count - 1)}>Decrement</button>
        <button onClick={() => setCount(count + 1)}>Increment</button>
        <button onClick={() => setCount(0)}>Reset</button>
      </div>
    </div>
  );
};

/**
 * User profile component using signals
 */
export const UserProfile: React.FC = () => {
  const [userName, setUserName] = useSignal(userNameSignal);
  const [isLoggedIn, setIsLoggedIn] = useSignal(isLoggedInSignal);
  const [welcomeMessage] = useSignal(welcomeMessageSignal);
  
  const handleLogin = () => {
    setIsLoggedIn(true);
  };
  
  const handleLogout = () => {
    setIsLoggedIn(false);
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(e.target.value);
  };
  
  return (
    <div className="user-profile">
      <h2>{welcomeMessage}</h2>
      
      <div className="form-group">
        <label htmlFor="user-name">Username:</label>
        <input
          id="user-name"
          type="text"
          value={userName}
          onChange={handleNameChange}
        />
      </div>
      
      <div className="login-controls">
        {isLoggedIn ? (
          <button onClick={handleLogout}>Log Out</button>
        ) : (
          <button onClick={handleLogin}>Log In</button>
        )}
      </div>
    </div>
  );
};

/**
 * Combined demo component
 */
export const SignalsDemo: React.FC = () => {
  return (
    <div className="signals-demo">
      <h1>Signals Demo</h1>
      <UserProfile />
      <Counter />
    </div>
  );
};
