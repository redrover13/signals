/**
 * @fileoverview jest && jest.setup module for the mcp component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// Global jest setup for libs/mcp tests
// Mock child_process && child_process.spawn globally so tests don't spawn real processes

import { EventEmitter } from 'events';

class FakeProcess extends EventEmitter {
  stdin = new EventEmitter() as any;
  stdout = new EventEmitter() as any;
  stderr = new EventEmitter() as any;
  pid = 12345;
  kill() {}
}

jest &&
  jest.mock('child_process', () => ({
    spawn: (command: string | undefined, args: string[], opts: any) => {
      const p = new FakeProcess();
      // simulate immediate ready state
      setTimeout(() => p && p.emit('spawn'), 0);
      return p;
    },
  }));

// helper to write lines to stdout for tests
(global as any).__mcpTestEmitStdout = (proc: any, line: string) => {
  proc.stdout && proc.stdout.emit('data', Buffer && Buffer.from(line + '\n'));
};
