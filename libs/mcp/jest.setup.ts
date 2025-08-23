// Global jest setup for libs/mcp tests
// Mock child_process.spawn globally so tests don't spawn real processes

import { EventEmitter } from 'events';

class FakeProcess extends EventEmitter {
  stdin = new EventEmitter() as any;
  stdout = new EventEmitter() as any;
  stderr = new EventEmitter() as any;
  pid = 12345;
  kill() {}
}

jest.mock('child_process', () => ({
  spawn: (command: string, args: string[], opts: any) => {
    const p = new FakeProcess();
    // simulate immediate ready state
    setTimeout(() => p.emit('spawn'), 0);
    return p;
  },
}));

// helper to write lines to stdout for tests
(global as any).__mcpTestEmitStdout = (proc: any, line: string) => {
  proc.stdout.emit('data', Buffer.from(line + '\n'));
};
