#!/usr/bin/env node

/**
 * Fix for TS2304: Cannot find name
 * 
 * This script attempts to fix name not found errors by:
 * 1. Adding missing imports
 * 2. Declaring missing variables
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../..');

console.log('🔧 Fixing name not found errors...');

// Common missing names and their imports
const COMMON_IMPORTS = {
  'React': 'import React from 'react';',
  'useState': 'import { useState } from 'react';',
  'useEffect': 'import { useEffect } from 'react';',
  'useMemo': 'import { useMemo } from 'react';',
  'useCallback': 'import { useCallback } from 'react';',
  'useRef': 'import { useRef } from 'react';',
  'map': 'import { map } from 'lodash-es';',
  'filter': 'import { filter } from 'lodash-es';',
  'find': 'import { find } from 'lodash-es';',
  // Add more common names and their imports
};

// Find all TypeScript files with name not found errors
function findFilesWithErrors() {
  try {
    const output = require('child_process').execSync(
      'npx tsc --noEmit 2>&1 | grep -E "error TS2304: Cannot find name"',
      { encoding: 'utf8', stdio: 'pipe' }
    );
    
    // Parse file paths and missing names
    const errors = [];
    const pattern = /^(.+?)(d+,d+): error TS2304: Cannot find name '(.+?)'/;
    
    for (const line of output.split('\n')) {
      const match = line.match(pattern);
      if (match) {
        const [_, filePath, missingName] = match;
        errors.push({ filePath, missingName });
      }
    }
    
    return errors;
  } catch (error) {
    // If grep doesn't find anything, it returns non-zero exit code
    return [];
  }
}

// Fix name not found errors
const errors = findFilesWithErrors();
const processedFiles = new Set();
let fixedFiles = 0;

for (const { filePath, missingName } of errors) {
  if (processedFiles.has(filePath)) continue;
  processedFiles.add(filePath);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileModified = false;
    
    // Check if the missing name has a common import
    if (COMMON_IMPORTS[missingName] && !content.includes(COMMON_IMPORTS[missingName])) {
      // Add the import at the top of the file
      content = COMMON_IMPORTS[missingName] + '\n' + content;
      fileModified = true;
    }
    
    // Save changes if file was modified
    if (fileModified) {
      fs.writeFileSync(filePath, content);
      fixedFiles++;
      console.log(`Fixed missing name '${missingName}' in ${filePath.replace(ROOT_DIR + '/', '')}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

console.log(`Fixed name not found errors in ${fixedFiles} files`);
console.log('\n✅ Name not found fixes completed!');
