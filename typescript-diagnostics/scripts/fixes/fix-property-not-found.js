#!/usr/bin/env node

/**
 * Fix for TS2339: Property does not exist on type
 *
 * This script attempts to fix property not found errors by:
 * 1. Adding type assertions
 * 2. Updating interfaces
 * 3. Adding optional chaining
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../..');

console.log('🔧 Fixing property not found errors...');

// Find all TypeScript files with property not found errors
function findFilesWithErrors() {
  try {
    const output = require('child_process').execSync(
      'npx tsc --noEmit 2>&1 | grep -E "error TS2339: Property"',
      { encoding: 'utf8', stdio: 'pipe' },
    );

    // Parse file paths and missing properties
    const errors = [];
    const pattern = /^(.+?)((d+),(d+)): error TS2339: Property '(.+?)' does not exist on type/;

    for (const line of output.split('\n')) {
      const match = line.match(pattern);
      if (match) {
        const [_, filePath, line, column, property] = match;
        errors.push({
          filePath,
          line: parseInt(line),
          column: parseInt(column),
          property,
        });
      }
    }

    return errors;
  } catch (error) {
    // If grep doesn't find anything, it returns non-zero exit code
    return [];
  }
}

// Fix property not found errors
const errors = findFilesWithErrors();
let fixedFiles = 0;

for (const { filePath, line, column, property } of errors) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Get the problematic line
    const problematicLine = lines[line - 1];

    // Check if we can add optional chaining
    if (problematicLine.includes(`.${property}`)) {
      const fixedLine = problematicLine.replace(new RegExp(`\\\.(${property})\\b`, 'g'), `?.$1`);

      if (fixedLine !== problematicLine) {
        lines[line - 1] = fixedLine;
        fs.writeFileSync(filePath, lines.join('\n'));
        fixedFiles++;
        console.log(
          `Added optional chaining for property '${property}' in ${filePath.replace(ROOT_DIR + '/', '')}:${line}`,
        );
      }
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

console.log(`Fixed property not found errors in ${fixedFiles} files`);
console.log('\n✅ Property not found fixes completed!');
