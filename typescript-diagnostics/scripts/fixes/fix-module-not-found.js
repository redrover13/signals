#!/usr/bin/env node

/**
 * Fix for TS2307: Cannot find module or its corresponding type declarations
 * 
 * This script attempts to fix module not found errors by:
 * 1. Installing missing dependencies
 * 2. Adding type declarations
 * 3. Updating import paths
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../..');

// Modules to install with their type declarations
const MODULES_TO_INSTALL = [
  // Add common modules here
  'lodash-es',
];

// Type declarations to install
const TYPES_TO_INSTALL = [
  '@types/lodash-es',
];

console.log('🔧 Fixing module not found errors...');

// 1. Install missing dependencies
console.log('\n📦 Installing missing dependencies...');

try {
  // Install modules
  if (MODULES_TO_INSTALL.length > 0) {
    console.log(`Installing modules: ${MODULES_TO_INSTALL.join(', ')}`);
    execSync(`pnpm add ${MODULES_TO_INSTALL.join(' ')}`, { 
      cwd: ROOT_DIR,
      stdio: 'inherit' 
    });
  }
  
  // Install type declarations
  if (TYPES_TO_INSTALL.length > 0) {
    console.log(`Installing type declarations: ${TYPES_TO_INSTALL.join(', ')}`);
    execSync(`pnpm add -D ${TYPES_TO_INSTALL.join(' ')}`, { 
      cwd: ROOT_DIR,
      stdio: 'inherit' 
    });
  }
} catch (error) {
  console.error('Error installing dependencies:', error.message);
}

// 2. Fix common import path issues
console.log('\n🔄 Fixing import paths...');

const IMPORT_PATH_FIXES = [
  { 
    find: /from ['"]lodash['"]/g, 
    replace: 'from 'lodash-es''
  },
  // Add more common import path fixes here
];

// Find all TypeScript files
function findTypeScriptFiles() {
  const tsFiles = [];
  
  function traverse(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        if (file.name !== 'node_modules' && file.name !== 'dist' && !file.name.startsWith('.')) {
          traverse(fullPath);
        }
      } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx'))) {
        tsFiles.push(fullPath);
      }
    }
  }
  
  traverse(ROOT_DIR);
  return tsFiles;
}

// Fix import paths in files
const tsFiles = findTypeScriptFiles();
let fixedFiles = 0;

for (const filePath of tsFiles) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileModified = false;
    
    // Apply each import path fix
    for (const { find, replace } of IMPORT_PATH_FIXES) {
      const originalContent = content;
      content = content.replace(find, replace);
      if (content !== originalContent) {
        fileModified = true;
      }
    }
    
    // Save changes if file was modified
    if (fileModified) {
      fs.writeFileSync(filePath, content);
      fixedFiles++;
      console.log(`Fixed imports in ${filePath.replace(ROOT_DIR + '/', '')}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

console.log(`Fixed imports in ${fixedFiles} files`);
console.log('\n✅ Module not found fixes completed!');
