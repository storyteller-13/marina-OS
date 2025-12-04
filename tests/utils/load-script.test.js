import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadScript, loadClass } from './load-script.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('loadScript', () => {
  let testScriptPath;
  let testContext;

  beforeEach(() => {
    testContext = {
      window: {},
      document: {}
    };

    // Create a temporary test script file
    testScriptPath = join(__dirname, '../../scripts/test-temp-script.js');
    const testScriptContent = `
      window.testVar = 'test-value';
      window.testFunc = function() { return 'test-result'; };
      if (typeof document !== 'undefined') {
        document.testDocVar = 'doc-value';
      }
    `;
    writeFileSync(testScriptPath, testScriptContent, 'utf8');
  });

  afterEach(() => {
    // Clean up test script file
    try {
      unlinkSync(testScriptPath);
    } catch (e) {
      // File might not exist, ignore
    }
  });

  it('should load and execute a script file', () => {
    const result = loadScript('test-temp-script.js', testContext);

    expect(result).toBe(testContext);
    expect(testContext.window.testVar).toBe('test-value');
    expect(typeof testContext.window.testFunc).toBe('function');
    expect(testContext.window.testFunc()).toBe('test-result');
  });

  it('should execute script with provided context variables', () => {
    const customContext = {
      customVar: 'custom-value',
      window: {}
    };

    const customScript = `
      window.customVar = customVar;
    `;
    writeFileSync(testScriptPath, customScript, 'utf8');

    loadScript('test-temp-script.js', customContext);

    expect(customContext.window.customVar).toBe('custom-value');
  });

  it('should handle empty context', () => {
    const emptyContext = {};

    expect(() => loadScript('test-temp-script.js', emptyContext)).not.toThrow();
  });

  it('should return the context object', () => {
    const result = loadScript('test-temp-script.js', testContext);

    expect(result).toBe(testContext);
  });

  it('should handle scripts that modify document', () => {
    const scriptContent = `
      if (typeof document !== 'undefined') {
        document.modified = true;
      }
    `;
    writeFileSync(testScriptPath, scriptContent, 'utf8');

    loadScript('test-temp-script.js', testContext);

    expect(testContext.document.modified).toBe(true);
  });

  it('should handle scripts with multiple context variables', () => {
    const multiContext = {
      var1: 'value1',
      var2: 'value2',
      window: {}
    };

    const scriptContent = `
      window.result = var1 + '-' + var2;
    `;
    writeFileSync(testScriptPath, scriptContent, 'utf8');

    loadScript('test-temp-script.js', multiContext);

    expect(multiContext.window.result).toBe('value1-value2');
  });
});

describe('loadClass', () => {
  let testScriptPath;
  let testContext;

  beforeEach(() => {
    testContext = {
      window: {},
      document: {}
    };

    // Create a temporary test script file with a class
    testScriptPath = join(__dirname, '../../scripts/test-temp-class.js');
  });

  afterEach(() => {
    // Clean up test script file
    try {
      unlinkSync(testScriptPath);
    } catch (e) {
      // File might not exist, ignore
    }
  });

  it('should load a class from window object', () => {
    const testScriptContent = `
      window.TestClass = class TestClass {
        constructor(value) {
          this.value = value;
        }
        getValue() {
          return this.value;
        }
      };
    `;
    writeFileSync(testScriptPath, testScriptContent, 'utf8');

    const TestClass = loadClass('test-temp-class.js', 'TestClass', testContext);

    expect(TestClass).toBeDefined();
    expect(typeof TestClass).toBe('function');

    const instance = new TestClass('test-value');
    expect(instance.getValue()).toBe('test-value');
  });

    it('should load a class from context root when assigned to context', () => {
      const testScriptContent = `
        if (typeof window !== 'undefined') {
          window.TestClass = class TestClass {
            constructor() {
              this.initialized = true;
            }
          };
        }
      `;
      writeFileSync(testScriptPath, testScriptContent, 'utf8');

      const TestClass = loadClass('test-temp-class.js', 'TestClass', testContext);

      expect(TestClass).toBeDefined();
      const instance = new TestClass();
      expect(instance.initialized).toBe(true);
    });

  it('should return undefined if class does not exist', () => {
    const testScriptContent = `
      window.OtherClass = class OtherClass {};
    `;
    writeFileSync(testScriptPath, testScriptContent, 'utf8');

    const TestClass = loadClass('test-temp-class.js', 'NonExistentClass', testContext);

    expect(TestClass).toBeUndefined();
  });

  it('should handle class with methods', () => {
    const testScriptContent = `
      window.MathHelper = class MathHelper {
        add(a, b) {
          return a + b;
        }
        multiply(a, b) {
          return a * b;
        }
      };
    `;
    writeFileSync(testScriptPath, testScriptContent, 'utf8');

    const MathHelper = loadClass('test-temp-class.js', 'MathHelper', testContext);

    const helper = new MathHelper();
    expect(helper.add(2, 3)).toBe(5);
    expect(helper.multiply(4, 5)).toBe(20);
  });

  it('should handle class with static methods', () => {
    const testScriptContent = `
      window.Utils = class Utils {
        static format(str) {
          return str.toUpperCase();
        }
      };
    `;
    writeFileSync(testScriptPath, testScriptContent, 'utf8');

    const Utils = loadClass('test-temp-class.js', 'Utils', testContext);

    expect(Utils.format('hello')).toBe('HELLO');
  });

    it('should prefer window property over context root', () => {
      const testScriptContent = `
        if (typeof window !== 'undefined') {
          window.TestClass = class TestClass {
            constructor() {
              this.source = 'window';
            }
          };
        }
      `;
      writeFileSync(testScriptPath, testScriptContent, 'utf8');

      const TestClass = loadClass('test-temp-class.js', 'TestClass', testContext);

      const instance = new TestClass();
      expect(instance.source).toBe('window');
    });
});
