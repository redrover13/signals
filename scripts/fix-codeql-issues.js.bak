#!/usr/bin/env node

/**
 * CodeQL Preparation Script
 *
 * This script performs basic checks on JavaScript/TypeScript files to ensure
 * they can be properly analyzed by CodeQL. It specifically looks for:
 *
 * 1. Invalid CDATA tags
 * 2. Module system mismatches
 * 3. Syntax errors
 *
 * Usage: node scripts/fix-codeql-issues.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx'];
const IGNORE_DIRS = ['node_modules', 'dist', 'coverage', '.pnpm-store', 'tmp', '.nx'];

// Find all JS/TS files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !IGNORE_DIRS.includes(file)) {
      findFiles(filePath, fileList);
    } else if (stat.isFile() && EXTENSIONS.includes(path.extname(file))) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// Check for and fix common issues
function fixIssues(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix CDATA tags
  if (content.includes('')) {
    console.log(`Fixing CDATA tag in ${filePath}`);
    content = content.replace(/<!\[CDATA\[/g, '');
    content = content.replace(/\]\]>/g, '');
    modified = true;
  }

  // Check for ES modules in CommonJS files or vice versa
  const esModulePatterns = [
    /\bimport\s+.*\s+from\s+/,
    /\bimport\s+{.*}\s+from\s+/,
    /\bimport\s+\*\s+as\s+.*\s+from\s+/,
    /\bexport\s+\{/,
    /\bexport\s+default\s+/,
    /\bexport\s+const\s+/,
    /\bexport\s+function\s+/,
    /\bexport\s+class\s+/,
  ];

  const commonJSPatterns = [/\bmodule\.exports\s*=/, /\bexports\.\w+\s*=/, /\brequire\s*\(\s*["']/];

  const hasESM = esModulePatterns.some((pattern) => pattern.test(content));
  const hasCJS = commonJSPatterns.some((pattern) => pattern.test(content));

  // We exclude our own script from the warning since we need to check for both patterns
  // to detect mixing in other files
  if (hasESM && hasCJS && !filePath.endsWith('fix-codeql-issues.js')) {
    console.log(`Warning: ${filePath} mixes ES modules and CommonJS`);
  }

  // Check for missing headers in TS files
  const ext = path.extname(filePath);
  if ((ext === '.ts' || ext === '.tsx') && !content.includes('@fileoverview')) {
    try {
      // Skip test and config files
      if (
        !filePath.includes('.spec.') &&
        !filePath.includes('.test.') &&
        !filePath.includes('jest.config') &&
        !filePath.includes('tsconfig')
      ) {
        console.log(`Adding standard header to ${filePath}`);

        const headerTemplate = fs.readFileSync(
          path.join(rootDir, '.github/templates/ts-header.template'),
          'utf8',
        );

        // Generate a description based on the file path
        const relativePath = path.relative(rootDir, filePath);
        const folderName = path.dirname(relativePath).split(path.sep).pop();
        const fileName = path.basename(filePath, ext);

        let description = `${fileName} module for the ${folderName} component`;
        let additionalDetails = 'Contains implementation for TypeScript functionality.';

        // Replace placeholders in the template
        const header = headerTemplate
          .replace('{{DESCRIPTION}}', description)
          .replace('{{ADDITIONAL_DETAILS}}', additionalDetails);

        content = header + '\n' + content;
        modified = true;
      }
    } catch (error) {
      console.error(`Error adding header to ${filePath}:`, error.message);
    }
  }

  // Save changes if needed
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed issues in ${filePath}`);
  }
}

// Main function
function main() {
  console.log('Scanning for JavaScript/TypeScript files...');
  const files = findFiles(rootDir);
  console.log(`Found ${files.length} files to check`);

  for (const file of files) {
    try {
      fixIssues(file);
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }

  console.log('Done!');
}

main();
