import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const scriptsBaseDir = join(__dirname, '../../scripts');

/**
 * Loads a JavaScript file and executes it in the given context
 * @param {string} relativePath - Path relative to scripts/ directory
 * @param {object} context - Context object (usually { window, document })
 * @returns {object} The context object with any globals added
 */
export function loadScript(relativePath, context = {}) {
  const scriptPath = join(scriptsBaseDir, relativePath);
  const code = readFileSync(scriptPath, 'utf8');

  // Create a function that will execute the code with the context variables
  const contextKeys = Object.keys(context);
  const contextValues = Object.values(context);

  // Execute the code in the context
  const func = new Function(...contextKeys, code);
  func(...contextValues);

  return context;
}

/**
 * Gets a class from a loaded script
 * @param {string} relativePath - Path relative to scripts/ directory
 * @param {string} className - Name of the class to extract
 * @param {object} context - Context object
 * @returns {Function} The class constructor
 */
export function getClass(relativePath, className, context = {}) {
  loadScript(relativePath, context);
  return context[className] || context.window?.[className];
}
