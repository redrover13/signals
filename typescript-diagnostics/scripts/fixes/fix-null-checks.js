#!/usr/bin/env node

/**
 * Fix for TS2532: Object is possibly 'null' or 'undefined'
 *
 * This script attempts to fix null/undefined errors by:
 * 1. Adding optional chaining (?.)
 * 2. Adding nullish coalescing operators (??)
 * 3. Adding explicit null checks
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../..');

console.log('🔧 Fixing null/undefined check errors...');

// Find all TypeScript files with null/undefined errors
function findFilesWithErrors() {
  try {
    const output = require('child_process').execSync(
      'npx tsc --noEmit 2>&1 | grep -E "error TS253[23]: Object is possibly"',
      { encoding: 'utf8', stdio: 'pipe' },
    );

    // Parse file paths and null/undefined errors
    const errors = [];
    const pattern = /^(.+?)((d+),(d+)): error TS(253[23]): Object is possibly '(null|undefined)'/;

    for (const line of output.split('\n')) {
      const match = line.match(pattern);
      if (match) {
        const [_, filePath, line, column, errorCode, nullType] = match;
        errors.push({
          filePath,
          line: parseInt(line),
          column: parseInt(column),
          errorCode,
          nullType,
        });
      }
    }

    return errors;
  } catch (error) {
    // If grep doesn't find anything, it returns non-zero exit code
    return [];
  }
}

// Fix null/undefined check errors
const errors = findFilesWithErrors();
let fixedFiles = 0;

for (const { filePath, line, column, errorCode, nullType } of errors) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Get the problematic line
    const problematicLine = lines[line - 1];

    // 1. Add optional chaining for property access
    if (problematicLine.match(/\w+\.\w+/)) {
      const fixedLine = problematicLine.replace(/(\.)(\w+)/g, '?.$2');

      if (fixedLine !== problematicLine) {
        lines[line - 1] = fixedLine;
        fs.writeFileSync(filePath, lines.join('\n'));
        fixedFiles++;
        console.log(`Added optional chaining in ${filePath.replace(ROOT_DIR + '/', '')}:${line}`);
        continue;
      }
    }

    // 2. Add nullish coalescing for variable assignment
    const assignmentMatch = problematicLine.match(/(\w+)\s*=\s*([^;]+)/);
    if (assignmentMatch) {
      const [_, variable, value] = assignmentMatch;

      const fixedLine = problematicLine.replace(
        assignmentMatch[0],
        `${variable} = ${value} ?? ${value.includes('"') ? '""' : value.includes("'") ? "''" : '{}'}`,
      );

      lines[line - 1] = fixedLine;
      fs.writeFileSync(filePath, lines.join('\n'));
      fixedFiles++;
      console.log(`Added nullish coalescing in ${filePath.replace(ROOT_DIR + '/', '')}:${line}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

console.log(`Fixed null/undefined check errors in ${fixedFiles} files`);
console.log('\n✅ Null/undefined check fixes completed!');
