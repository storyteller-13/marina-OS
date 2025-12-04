import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Loads a JavaScript file and evaluates it in the given context
 */
export function loadScript(relativePath, context = {}) {
  const scriptPath = join(__dirname, '../../scripts', relativePath);
  const code = readFileSync(scriptPath, 'utf8');

  // Create a function that will execute the code in the given context
  const func = new Function(...Object.keys(context), code);
  func(...Object.values(context));

  return context;
}

/**
 * Loads a script and returns the class/object from it
 */
export function loadClass(relativePath, className, context = {}) {
  const scriptPath = join(__dirname, '../../scripts', relativePath);
  const code = readFileSync(scriptPath, 'utf8');

  // Execute in context
  const func = new Function(...Object.keys(context), code);
  func(...Object.values(context));

  // Return the class from the context
  return context[className] || context.window?.[className];
}
