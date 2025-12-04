#!/usr/bin/env node
/**
 * Script to fix imports in all test files
 * This converts require() statements to ES module imports
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const testsDir = join(__dirname);

async function fixTestFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if file already has the imports at the top
  if (content.includes("import { readFileSync } from 'fs'")) {
    return false; // Already fixed
  }

  // Add imports if they don't exist
  if (!content.includes("import { readFileSync } from 'fs'")) {
    const importMatch = content.match(/^import .+ from 'vitest';/m);
    if (importMatch) {
      const imports = `import { readFileSync } from 'fs';\nimport { join, dirname } from 'path';\nimport { fileURLToPath } from 'url';\n\nconst __filename = fileURLToPath(import.meta.url);\nconst __dirname = dirname(__filename);\n`;
      content = content.replace(importMatch[0], importMatch[0] + '\n' + imports);
      modified = true;
    }
  }

  // Replace require() patterns
  const requirePattern = /const fs = require\('fs'\);\s*const path = require\('path'\);\s*const code = fs\.readFileSync\(path\.join\(__dirname, '([^']+)'\), 'utf8'\);\s*eval\(code\);/g;

  if (requirePattern.test(content)) {
    content = content.replace(requirePattern, (match, relPath) => {
      return `const code = readFileSync(join(__dirname, '${relPath}'), 'utf8');\n    const func = new Function('window', 'document', code);\n    func(window, document);`;
    });
    modified = true;
  }

  // Replace simpler require patterns
  content = content.replace(/const fs = require\('fs'\);\s*const path = require\('path'\);/g, '');
  content = content.replace(/eval\(code\);/g, 'const func = new Function(\'window\', \'document\', code);\n    func(window, document);');

  if (modified) {
    writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

async function main() {
  const testFiles = await glob('**/*.test.js', { cwd: testsDir });
  let fixedCount = 0;

  for (const file of testFiles) {
    const filePath = join(testsDir, file);
    if (await fixTestFile(filePath)) {
      fixedCount++;
      console.log(`Fixed: ${file}`);
    }
  }

  console.log(`\nFixed ${fixedCount} test files`);
}

main().catch(console.error);
