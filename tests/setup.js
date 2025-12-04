import { beforeEach, afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  // Clear any global state
  if (global.window?.localStorage && typeof global.window.localStorage.clear === 'function') {
    global.window.localStorage.clear();
  }
  if (global.localStorage && typeof global.localStorage.clear === 'function') {
    global.localStorage.clear();
  }
});

// Mock localStorage
beforeEach(() => {
  if (global.window?.localStorage && typeof global.window.localStorage.clear === 'function') {
    global.window.localStorage.clear();
  }
  if (global.localStorage && typeof global.localStorage.clear === 'function') {
    global.localStorage.clear();
  }
});
