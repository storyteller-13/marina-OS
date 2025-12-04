import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadScript, getClass } from './script-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('script-loader', () => {
  let testScriptPath;
  let testContext;

  beforeEach(() => {
    testContext = {
      window: {},
      document: {}
    };

    // Create a temporary test script file
    testScriptPath = join(__dirname, '../../scripts/test-temp-loader.js');
  });

  afterEach(() => {
    // Clean up test script file
    try {
      unlinkSync(testScriptPath);
    } catch (e) {
      // File might not exist, ignore
    }
  });

  describe('loadScript', () => {
    it('should load and execute a script file', () => {
      const testScriptContent = `
        window.testVar = 'loaded-value';
        window.testNumber = 42;
      `;
      writeFileSync(testScriptPath, testScriptContent, 'utf8');

      const result = loadScript('test-temp-loader.js', testContext);

      expect(result).toBe(testContext);
      expect(testContext.window.testVar).toBe('loaded-value');
      expect(testContext.window.testNumber).toBe(42);
    });

    it('should execute script with provided context variables', () => {
      const customContext = {
        myVar: 'my-value',
        window: {}
      };

      const customScript = `
        window.result = myVar + '-processed';
      `;
      writeFileSync(testScriptPath, customScript, 'utf8');

      loadScript('test-temp-loader.js', customContext);

      expect(customContext.window.result).toBe('my-value-processed');
    });

    it('should handle multiple context variables', () => {
      const multiContext = {
        a: 10,
        b: 20,
        window: {}
      };

      const scriptContent = `
        window.sum = a + b;
        window.product = a * b;
      `;
      writeFileSync(testScriptPath, scriptContent, 'utf8');

      loadScript('test-temp-loader.js', multiContext);

      expect(multiContext.window.sum).toBe(30);
      expect(multiContext.window.product).toBe(200);
    });

    it('should handle empty context', () => {
      const emptyContext = {};
      const scriptContent = `
        // Script that doesn't use context
        if (typeof window !== 'undefined') {
          window.executed = true;
        }
      `;
      writeFileSync(testScriptPath, scriptContent, 'utf8');

      expect(() => loadScript('test-temp-loader.js', emptyContext)).not.toThrow();
    });

    it('should return the context object', () => {
      const scriptContent = `
        window.test = 'test';
      `;
      writeFileSync(testScriptPath, scriptContent, 'utf8');

      const result = loadScript('test-temp-loader.js', testContext);

      expect(result).toBe(testContext);
    });

    it('should handle scripts that modify document', () => {
      const scriptContent = `
        if (typeof document !== 'undefined') {
          document.title = 'Test Title';
          document.modified = true;
        }
      `;
      writeFileSync(testScriptPath, scriptContent, 'utf8');

      loadScript('test-temp-loader.js', testContext);

      expect(testContext.document.title).toBe('Test Title');
      expect(testContext.document.modified).toBe(true);
    });

    it('should handle scripts with functions', () => {
      const scriptContent = `
        window.myFunction = function(x) {
          return x * 2;
        };
      `;
      writeFileSync(testScriptPath, scriptContent, 'utf8');

      loadScript('test-temp-loader.js', testContext);

      expect(typeof testContext.window.myFunction).toBe('function');
      expect(testContext.window.myFunction(5)).toBe(10);
    });
  });

  describe('getClass', () => {
    it('should get a class from window object', () => {
      const testScriptContent = `
        window.MyClass = class MyClass {
          constructor(name) {
            this.name = name;
          }
          getName() {
            return this.name;
          }
        };
      `;
      writeFileSync(testScriptPath, testScriptContent, 'utf8');

      const MyClass = getClass('test-temp-loader.js', 'MyClass', testContext);

      expect(MyClass).toBeDefined();
      expect(typeof MyClass).toBe('function');

      const instance = new MyClass('test-name');
      expect(instance.getName()).toBe('test-name');
    });

    it('should get a class from context root when assigned to context', () => {
      const testScriptContent = `
        if (typeof window !== 'undefined') {
          window.RootClass = class RootClass {
            constructor() {
              this.initialized = true;
            }
          };
        }
      `;
      writeFileSync(testScriptPath, testScriptContent, 'utf8');

      const RootClass = getClass('test-temp-loader.js', 'RootClass', testContext);

      expect(RootClass).toBeDefined();
      const instance = new RootClass();
      expect(instance.initialized).toBe(true);
    });

    it('should get class from window when available', () => {
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

      const TestClass = getClass('test-temp-loader.js', 'TestClass', testContext);

      const instance = new TestClass();
      expect(instance.source).toBe('window');
    });

    it('should return undefined if class does not exist', () => {
      const testScriptContent = `
        window.OtherClass = class OtherClass {};
      `;
      writeFileSync(testScriptPath, testScriptContent, 'utf8');

      const NonExistent = getClass('test-temp-loader.js', 'NonExistentClass', testContext);

      expect(NonExistent).toBeUndefined();
    });

    it('should handle class with static methods', () => {
      const testScriptContent = `
        window.StringHelper = class StringHelper {
          static capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
          }
          static reverse(str) {
            return str.split('').reverse().join('');
          }
        };
      `;
      writeFileSync(testScriptPath, testScriptContent, 'utf8');

      const StringHelper = getClass('test-temp-loader.js', 'StringHelper', testContext);

      expect(StringHelper.capitalize('hello')).toBe('Hello');
      expect(StringHelper.reverse('world')).toBe('dlrow');
    });

    it('should handle class with instance methods', () => {
      const testScriptContent = `
        window.Calculator = class Calculator {
          constructor() {
            this.history = [];
          }
          add(a, b) {
            const result = a + b;
            this.history.push({ operation: 'add', result });
            return result;
          }
          getHistory() {
            return this.history;
          }
        };
      `;
      writeFileSync(testScriptPath, testScriptContent, 'utf8');

      const Calculator = getClass('test-temp-loader.js', 'Calculator', testContext);

      const calc = new Calculator();
      expect(calc.add(5, 3)).toBe(8);
      expect(calc.getHistory()).toHaveLength(1);
    });

    it('should handle class inheritance', () => {
      const testScriptContent = `
        window.BaseClass = class BaseClass {
          constructor(name) {
            this.name = name;
          }
        };
        window.DerivedClass = class DerivedClass extends window.BaseClass {
          constructor(name, value) {
            super(name);
            this.value = value;
          }
        };
      `;
      writeFileSync(testScriptPath, testScriptContent, 'utf8');

      const DerivedClass = getClass('test-temp-loader.js', 'DerivedClass', testContext);

      const instance = new DerivedClass('test', 42);
      expect(instance.name).toBe('test');
      expect(instance.value).toBe(42);
    });
  });
});
