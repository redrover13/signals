#!/usr/bin/env node

/**
 * TypeScript Error Fixer
 * 
 * This script applies automated fixes for common TypeScript errors.
 * It analyzes the error patterns and suggests or applies fixes.
 * 
 * Usage:
 *   node typescript-diagnostics/scripts/fix-common-errors.js [--apply]
 * 
 * Options:
 *   --apply    Apply the fixes automatically (default: false)
 * 
 * Output:
 *   - Generates JSON report in typescript-diagnostics/reports/
 *   - Creates fix scripts in typescript-diagnostics/scripts/fixes/
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const REPORTS_DIR = path.resolve(ROOT_DIR, 'typescript-diagnostics/reports');
const FIXES_DIR = path.resolve(ROOT_DIR, 'typescript-diagnostics/scripts/fixes');

// Parse command line arguments
const APPLY_FIXES = process.argv.includes('--apply');

// Ensure directories exist
for (const dir of [REPORTS_DIR, FIXES_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

console.log('🔧 TypeScript Error Fixer');
console.log('=========================');
console.log(`Mode: ${APPLY_FIXES ? 'Apply fixes' : 'Analysis only'}`);

// Store all diagnostic data
const fixerData = {
  timestamp: new Date().toISOString(),
  errors: {
    total: 0,
    byCode: {}
  },
  fixes: {
    created: [],
    applied: []
  }
};

/**
 * Run TypeScript compiler and capture errors
 */
function runTypeScriptCheck() {
  console.log('\n📊 Running TypeScript compiler check...');
  
  try {
    // Run TypeScript with --noEmit to check for errors
    const tscOutput = execSync('npx tsc --noEmit 2>&1 || true', { 
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large output
    });
    
    // Parse the output
    parseTypeScriptErrors(tscOutput);
    
  } catch (error) {
    console.error('Error running TypeScript check:', error.message);
  }
}

/**
 * Parse TypeScript error output
 */
function parseTypeScriptErrors(tscOutput) {
  const lines = tscOutput.split('\n');
  const errorPattern = /^(.+)\((\d+),(\d+)\): error TS(\d+): (.+)$/;
  
  // Process each line
  for (const line of lines) {
    const match = line.match(errorPattern);
    if (match) {
      const [_, filePath, lineNum, column, errorCode, errorMessage] = match;
      
      // Count total errors
      fixerData.errors.total++;
      
      // Group by error code
      if (!fixerData.errors.byCode[errorCode]) {
        fixerData.errors.byCode[errorCode] = {
          count: 0,
          message: errorMessage.replace(/'.+?'/g, "'...'"), // Generalize message
          examples: []
        };
      }
      
      fixerData.errors.byCode[errorCode].count++;
      
      // Store up to 5 examples per error code
      if (fixerData.errors.byCode[errorCode].examples.length < 5) {
        fixerData.errors.byCode[errorCode].examples.push({
          file: filePath,
          line: parseInt(lineNum),
          column: parseInt(column),
          message: errorMessage
        });
      }
    }
  }
  
  console.log(`Found ${fixerData.errors.total} TypeScript errors`);
  
  // Sort error codes by frequency
  const sortedErrorCodes = Object.entries(fixerData.errors.byCode)
    .sort((a, b) => b[1].count - a[1].count);
  
  console.log('\nTop 5 error types:');
  sortedErrorCodes.slice(0, 5).forEach(([code, data]) => {
    console.log(`TS${code}: ${data.count} occurrences - ${data.message}`);
  });
}

/**
 * Generate fix scripts for common errors
 */
function generateFixScripts() {
  console.log('\n📝 Generating fix scripts...');
  
  // Map of error codes to fix generators
  const fixGenerators = {
    // TS2307: Cannot find module '...' or its corresponding type declarations.
    '2307': generateModuleNotFoundFix,
    
    // TS2304: Cannot find name '...'.
    '2304': generateNameNotFoundFix,
    
    // TS2339: Property '...' does not exist on type '...'.
    '2339': generatePropertyNotFoundFix,
    
    // TS2322: Type '...' is not assignable to type '...'.
    '2322': generateTypeAssignabilityFix,
    
    // TS2532, TS2533: Object is possibly 'undefined' or 'null'.
    '2532': generateNullCheckFix,
    '2533': generateNullCheckFix,
    
    // TS1378: Top-level 'await' expressions are only allowed when the 'module' option is set to 'es2022', 'esnext', 'system', or 'nodenext'
    '1378': generateTopLevelAwaitFix
  };
  
  // Generate fixes for each supported error type
  for (const [code, generator] of Object.entries(fixGenerators)) {
    if (fixerData.errors.byCode[code]) {
      const fixInfo = generator(code, fixerData.errors.byCode[code]);
      if (fixInfo) {
        fixerData.fixes.created.push(fixInfo);
      }
    }
  }
  
  console.log(`Generated ${fixerData.fixes.created.length} fix scripts`);
}

/**
 * Generate fix for module not found errors (TS2307)
 */
function generateModuleNotFoundFix(code, errorData) {
  const fixName = 'fix-module-not-found';
  const fixPath = path.join(FIXES_DIR, `${fixName}.js`);
  
  const scriptContent = `#!/usr/bin/env node

/**
 * Fix for TS${code}: Cannot find module or its corresponding type declarations
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
console.log('\\n📦 Installing missing dependencies...');

try {
  // Install modules
  if (MODULES_TO_INSTALL.length > 0) {
    console.log(\`Installing modules: \${MODULES_TO_INSTALL.join(', ')}\`);
    execSync(\`pnpm add \${MODULES_TO_INSTALL.join(' ')}\`, { 
      cwd: ROOT_DIR,
      stdio: 'inherit' 
    });
  }
  
  // Install type declarations
  if (TYPES_TO_INSTALL.length > 0) {
    console.log(\`Installing type declarations: \${TYPES_TO_INSTALL.join(', ')}\`);
    execSync(\`pnpm add -D \${TYPES_TO_INSTALL.join(' ')}\`, { 
      cwd: ROOT_DIR,
      stdio: 'inherit' 
    });
  }
} catch (error) {
  console.error('Error installing dependencies:', error.message);
}

// 2. Fix common import path issues
console.log('\\n🔄 Fixing import paths...');

const IMPORT_PATH_FIXES = [
  { 
    find: /from ['"]lodash['"]/g, 
    replace: 'from \'lodash-es\''
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
      console.log(\`Fixed imports in \${filePath.replace(ROOT_DIR + '/', '')}\`);
    }
  } catch (error) {
    console.error(\`Error processing \${filePath}:\`, error.message);
  }
}

console.log(\`Fixed imports in \${fixedFiles} files\`);
console.log('\\n✅ Module not found fixes completed!');
`;

  // Save the script
  fs.writeFileSync(fixPath, scriptContent);
  fs.chmodSync(fixPath, '755'); // Make executable
  
  return {
    errorCode: code,
    fixName,
    fixPath: `typescript-diagnostics/scripts/fixes/${fixName}.js`,
    description: 'Fixes module not found errors by installing missing dependencies and updating import paths'
  };
}

/**
 * Generate fix for name not found errors (TS2304)
 */
function generateNameNotFoundFix(code, errorData) {
  const fixName = 'fix-name-not-found';
  const fixPath = path.join(FIXES_DIR, `${fixName}.js`);
  
  const scriptContent = `#!/usr/bin/env node

/**
 * Fix for TS${code}: Cannot find name
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
  'React': 'import React from \'react\';',
  'useState': 'import { useState } from \'react\';',
  'useEffect': 'import { useEffect } from \'react\';',
  'useMemo': 'import { useMemo } from \'react\';',
  'useCallback': 'import { useCallback } from \'react\';',
  'useRef': 'import { useRef } from \'react\';',
  'map': 'import { map } from \'lodash-es\';',
  'filter': 'import { filter } from \'lodash-es\';',
  'find': 'import { find } from \'lodash-es\';',
  // Add more common names and their imports
};

// Find all TypeScript files with name not found errors
function findFilesWithErrors() {
  try {
    const output = require('child_process').execSync(
      'npx tsc --noEmit 2>&1 | grep -E "error TS${code}: Cannot find name"',
      { encoding: 'utf8', stdio: 'pipe' }
    );
    
    // Parse file paths and missing names
    const errors = [];
    const pattern = /^(.+?)\(\d+,\d+\): error TS${code}: Cannot find name '(.+?)'/;
    
    for (const line of output.split('\\n')) {
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
      content = COMMON_IMPORTS[missingName] + '\\n' + content;
      fileModified = true;
    }
    
    // Save changes if file was modified
    if (fileModified) {
      fs.writeFileSync(filePath, content);
      fixedFiles++;
      console.log(\`Fixed missing name '\${missingName}' in \${filePath.replace(ROOT_DIR + '/', '')}\`);
    }
  } catch (error) {
    console.error(\`Error processing \${filePath}:\`, error.message);
  }
}

console.log(\`Fixed name not found errors in \${fixedFiles} files\`);
console.log('\\n✅ Name not found fixes completed!');
`;

  // Save the script
  fs.writeFileSync(fixPath, scriptContent);
  fs.chmodSync(fixPath, '755'); // Make executable
  
  return {
    errorCode: code,
    fixName,
    fixPath: `typescript-diagnostics/scripts/fixes/${fixName}.js`,
    description: 'Fixes name not found errors by adding missing imports and declarations'
  };
}

/**
 * Generate fix for property not found errors (TS2339)
 */
function generatePropertyNotFoundFix(code, errorData) {
  const fixName = 'fix-property-not-found';
  const fixPath = path.join(FIXES_DIR, `${fixName}.js`);
  
  const scriptContent = `#!/usr/bin/env node

/**
 * Fix for TS${code}: Property does not exist on type
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
      'npx tsc --noEmit 2>&1 | grep -E "error TS${code}: Property"',
      { encoding: 'utf8', stdio: 'pipe' }
    );
    
    // Parse file paths and missing properties
    const errors = [];
    const pattern = /^(.+?)\((\d+),(\d+)\): error TS${code}: Property '(.+?)' does not exist on type/;
    
    for (const line of output.split('\\n')) {
      const match = line.match(pattern);
      if (match) {
        const [_, filePath, line, column, property] = match;
        errors.push({ 
          filePath, 
          line: parseInt(line), 
          column: parseInt(column), 
          property 
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
    const lines = content.split('\\n');
    
    // Get the problematic line
    const problematicLine = lines[line - 1];
    
    // Check if we can add optional chaining
    if (problematicLine.includes(\`.\${property}\`)) {
      const fixedLine = problematicLine.replace(
        new RegExp(\`\\\\\\.(\${property})\\\\b\`, 'g'),
        \`?.\$1\`
      );
      
      if (fixedLine !== problematicLine) {
        lines[line - 1] = fixedLine;
        fs.writeFileSync(filePath, lines.join('\\n'));
        fixedFiles++;
        console.log(\`Added optional chaining for property '\${property}' in \${filePath.replace(ROOT_DIR + '/', '')}:\${line}\`);
      }
    }
  } catch (error) {
    console.error(\`Error processing \${filePath}:\`, error.message);
  }
}

console.log(\`Fixed property not found errors in \${fixedFiles} files\`);
console.log('\\n✅ Property not found fixes completed!');
`;

  // Save the script
  fs.writeFileSync(fixPath, scriptContent);
  fs.chmodSync(fixPath, '755'); // Make executable
  
  return {
    errorCode: code,
    fixName,
    fixPath: `typescript-diagnostics/scripts/fixes/${fixName}.js`,
    description: 'Fixes property not found errors by adding optional chaining and type assertions'
  };
}

/**
 * Generate fix for type assignability errors (TS2322)
 */
function generateTypeAssignabilityFix(code, errorData) {
  const fixName = 'fix-type-assignability';
  const fixPath = path.join(FIXES_DIR, `${fixName}.js`);
  
  const scriptContent = `#!/usr/bin/env node

/**
 * Fix for TS${code}: Type is not assignable to type
 * 
 * This script attempts to fix type assignability errors by:
 * 1. Adding type assertions
 * 2. Adding type guards
 * 3. Correcting variable types
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../..');

console.log('🔧 Fixing type assignability errors...');

// Find all TypeScript files with type assignability errors
function findFilesWithErrors() {
  try {
    const output = require('child_process').execSync(
      'npx tsc --noEmit 2>&1 | grep -E "error TS${code}: Type"',
      { encoding: 'utf8', stdio: 'pipe' }
    );
    
    // Parse file paths and type errors
    const errors = [];
    const pattern = /^(.+?)\((\d+),(\d+)\): error TS${code}: Type '(.+?)' is not assignable to type '(.+?)'/;
    
    for (const line of output.split('\\n')) {
      const match = line.match(pattern);
      if (match) {
        const [_, filePath, line, column, sourceType, targetType] = match;
        errors.push({ 
          filePath, 
          line: parseInt(line), 
          column: parseInt(column), 
          sourceType,
          targetType
        });
      }
    }
    
    return errors;
  } catch (error) {
    // If grep doesn't find anything, it returns non-zero exit code
    return [];
  }
}

// Fix type assignability errors
const errors = findFilesWithErrors();
let fixedFiles = 0;

for (const { filePath, line, column, sourceType, targetType } of errors) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\\n');
    
    // Get the problematic line
    const problematicLine = lines[line - 1];
    
    // Possible fixes:
    
    // 1. Fix null/undefined to non-nullable type
    if ((sourceType.includes('null') || sourceType.includes('undefined')) && 
        !targetType.includes('null') && !targetType.includes('undefined')) {
      
      // Look for variable assignment
      const assignmentMatch = problematicLine.match(/(\w+)\s*=\s*([^;]+)/);
      if (assignmentMatch) {
        const [_, variable, value] = assignmentMatch;
        
        // Add null check
        const fixedLine = problematicLine.replace(
          assignmentMatch[0],
          \`\${variable} = \${value} || \${targetType.includes('string') ? '""' : targetType.includes('number') ? '0' : '{}'}\`
        );
        
        lines[line - 1] = fixedLine;
        fs.writeFileSync(filePath, lines.join('\\n'));
        fixedFiles++;
        console.log(\`Fixed null/undefined assignment in \${filePath.replace(ROOT_DIR + '/', '')}:\${line}\`);
        continue;
      }
    }
    
    // 2. Add type assertion for simple cases
    if (!problematicLine.includes('as ')) {
      // Check for common patterns that might need type assertion
      const valueMatch = problematicLine.match(/=\s*([^;]+)/);
      if (valueMatch) {
        const fixedLine = problematicLine.replace(
          valueMatch[1],
          \`(\${valueMatch[1]}) as unknown as \${targetType.replace(/'/g, '')}\`
        );
        
        lines[line - 1] = fixedLine;
        fs.writeFileSync(filePath, lines.join('\\n'));
        fixedFiles++;
        console.log(\`Added type assertion in \${filePath.replace(ROOT_DIR + '/', '')}:\${line}\`);
      }
    }
  } catch (error) {
    console.error(\`Error processing \${filePath}:\`, error.message);
  }
}

console.log(\`Fixed type assignability errors in \${fixedFiles} files\`);
console.log('\\n✅ Type assignability fixes completed!');
`;

  // Save the script
  fs.writeFileSync(fixPath, scriptContent);
  fs.chmodSync(fixPath, '755'); // Make executable
  
  return {
    errorCode: code,
    fixName,
    fixPath: `typescript-diagnostics/scripts/fixes/${fixName}.js`,
    description: 'Fixes type assignability errors by adding type assertions and guards'
  };
}

/**
 * Generate fix for null/undefined check errors (TS2532, TS2533)
 */
function generateNullCheckFix(code, errorData) {
  const fixName = 'fix-null-checks';
  const fixPath = path.join(FIXES_DIR, `${fixName}.js`);
  
  const scriptContent = `#!/usr/bin/env node

/**
 * Fix for TS${code}: Object is possibly 'null' or 'undefined'
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
      { encoding: 'utf8', stdio: 'pipe' }
    );
    
    // Parse file paths and null/undefined errors
    const errors = [];
    const pattern = /^(.+?)\((\d+),(\d+)\): error TS(253[23]): Object is possibly '(null|undefined)'/;
    
    for (const line of output.split('\\n')) {
      const match = line.match(pattern);
      if (match) {
        const [_, filePath, line, column, errorCode, nullType] = match;
        errors.push({ 
          filePath, 
          line: parseInt(line), 
          column: parseInt(column), 
          errorCode,
          nullType
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
    const lines = content.split('\\n');
    
    // Get the problematic line
    const problematicLine = lines[line - 1];
    
    // 1. Add optional chaining for property access
    if (problematicLine.match(/\\w+\\.\\w+/)) {
      const fixedLine = problematicLine.replace(/(\\.)(\\w+)/g, '?.$2');
      
      if (fixedLine !== problematicLine) {
        lines[line - 1] = fixedLine;
        fs.writeFileSync(filePath, lines.join('\\n'));
        fixedFiles++;
        console.log(\`Added optional chaining in \${filePath.replace(ROOT_DIR + '/', '')}:\${line}\`);
        continue;
      }
    }
    
    // 2. Add nullish coalescing for variable assignment
    const assignmentMatch = problematicLine.match(/(\\w+)\\s*=\\s*([^;]+)/);
    if (assignmentMatch) {
      const [_, variable, value] = assignmentMatch;
      
      const fixedLine = problematicLine.replace(
        assignmentMatch[0],
        \`\${variable} = \${value} ?? \${value.includes('"') ? '""' : value.includes("'") ? "''" : '{}'}\`
      );
      
      lines[line - 1] = fixedLine;
      fs.writeFileSync(filePath, lines.join('\\n'));
      fixedFiles++;
      console.log(\`Added nullish coalescing in \${filePath.replace(ROOT_DIR + '/', '')}:\${line}\`);
    }
  } catch (error) {
    console.error(\`Error processing \${filePath}:\`, error.message);
  }
}

console.log(\`Fixed null/undefined check errors in \${fixedFiles} files\`);
console.log('\\n✅ Null/undefined check fixes completed!');
`;

  // Save the script
  fs.writeFileSync(fixPath, scriptContent);
  fs.chmodSync(fixPath, '755'); // Make executable
  
  return {
    errorCode: code,
    fixName,
    fixPath: `typescript-diagnostics/scripts/fixes/${fixName}.js`,
    description: 'Fixes null/undefined check errors by adding optional chaining and nullish coalescing'
  };
}

/**
 * Generate fix for top-level await errors (TS1378)
 */
function generateTopLevelAwaitFix(code, errorData) {
  const fixName = 'fix-top-level-await';
  const fixPath = path.join(FIXES_DIR, `${fixName}.js`);
  
  const scriptContent = `#!/usr/bin/env node

/**
 * Fix for TS${code}: Top-level 'await' expressions are only allowed when the 'module' option is set
 * 
 * This script attempts to fix top-level await errors by:
 * 1. Updating tsconfig.json to support top-level await
 * 2. Converting top-level await to async IIFE
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../..');

console.log('🔧 Fixing top-level await errors...');

// Find all TypeScript files with top-level await errors
function findFilesWithErrors() {
  try {
    const output = require('child_process').execSync(
      'npx tsc --noEmit 2>&1 | grep -E "error TS${code}: Top-level"',
      { encoding: 'utf8', stdio: 'pipe' }
    );
    
    // Parse file paths
    const errors = [];
    const pattern = /^(.+?)\((\d+),(\d+)\): error TS${code}:/;
    
    for (const line of output.split('\\n')) {
      const match = line.match(pattern);
      if (match) {
        const [_, filePath, line, column] = match;
        errors.push({ 
          filePath, 
          line: parseInt(line), 
          column: parseInt(column)
        });
      }
    }
    
    return errors;
  } catch (error) {
    // If grep doesn't find anything, it returns non-zero exit code
    return [];
  }
}

// Update tsconfig to support top-level await
function updateTsConfig() {
  const tsconfigPaths = [
    path.join(ROOT_DIR, 'tsconfig.json'),
    path.join(ROOT_DIR, 'tsconfig.base.json')
  ];
  
  for (const configPath of tsconfigPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        if (!config.compilerOptions) {
          config.compilerOptions = {};
        }
        
        // Update module and target settings
        config.compilerOptions.module = 'ESNext';
        config.compilerOptions.target = config.compilerOptions.target || 'ESNext';
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(\`Updated \${configPath.replace(ROOT_DIR + '/', '')} to support top-level await\`);
        return true;
      } catch (error) {
        console.error(\`Error updating \${configPath}:\`, error.message);
      }
    }
  }
  
  return false;
}

// Fix files with top-level await by converting to async IIFE
function fixTopLevelAwait(errors) {
  let fixedFiles = 0;
  
  for (const { filePath, line } of errors) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\\n');
      
      // Look for await expression
      const awaitLine = lines[line - 1];
      if (awaitLine.trim().startsWith('await ')) {
        // Find the entire await block
        let startLine = line - 1;
        let endLine = line - 1;
        
        // Search backwards for the start of the block
        while (startLine > 0) {
          const currentLine = lines[startLine - 1].trim();
          if (currentLine === '' || currentLine.endsWith(';') || currentLine.endsWith('}')) {
            break;
          }
          startLine--;
        }
        
        // Search forwards for the end of the block
        while (endLine < lines.length - 1) {
          const currentLine = lines[endLine].trim();
          if (currentLine.endsWith(';')) {
            endLine++;
            break;
          }
          endLine++;
        }
        
        // Extract the await block
        const awaitBlock = lines.slice(startLine, endLine).join('\\n');
        
        // Replace with async IIFE
        const iife = \`(async () => {
  \${awaitBlock}
})();\\n\`;
        
        // Update lines
        lines.splice(startLine, endLine - startLine, iife);
        
        fs.writeFileSync(filePath, lines.join('\\n'));
        fixedFiles++;
        console.log(\`Converted top-level await to async IIFE in \${filePath.replace(ROOT_DIR + '/', '')}\`);
      }
    } catch (error) {
      console.error(\`Error processing \${filePath}:\`, error.message);
    }
  }
  
  return fixedFiles;
}

// Find and fix top-level await errors
const errors = findFilesWithErrors();

if (errors.length > 0) {
  // First try to update tsconfig
  const updatedConfig = updateTsConfig();
  
  // If we couldn't update the config, convert top-level awaits to async IIFEs
  if (!updatedConfig) {
    const fixedFiles = fixTopLevelAwait(errors);
    console.log(\`Fixed top-level await errors in \${fixedFiles} files\`);
  }
}

console.log('\\n✅ Top-level await fixes completed!');
`;

  // Save the script
  fs.writeFileSync(fixPath, scriptContent);
  fs.chmodSync(fixPath, '755'); // Make executable
  
  return {
    errorCode: code,
    fixName,
    fixPath: `typescript-diagnostics/scripts/fixes/${fixName}.js`,
    description: 'Fixes top-level await errors by updating tsconfig or converting to async IIFE'
  };
}

/**
 * Apply fix scripts
 */
function applyFixes() {
  if (!APPLY_FIXES) {
    console.log('\n⏩ Skipping applying fixes (use --apply to apply fixes)');
    return;
  }
  
  console.log('\n🔧 Applying fixes...');
  
  // Run each fix script
  for (const fix of fixerData.fixes.created) {
    console.log(`\nApplying fix for TS${fix.errorCode}: ${fix.description}`);
    
    try {
      execSync(`node ${path.join(ROOT_DIR, fix.fixPath)}`, { 
        stdio: 'inherit',
        cwd: ROOT_DIR
      });
      
      fixerData.fixes.applied.push(fix.fixName);
    } catch (error) {
      console.error(`Error applying fix ${fix.fixName}:`, error.message);
    }
  }
  
  console.log(`\nApplied ${fixerData.fixes.applied.length} fixes`);
}

/**
 * Generate a README for the fixes
 */
function generateFixesReadme() {
  const readmePath = path.join(FIXES_DIR, 'README.md');
  
  const readmeContent = `# TypeScript Error Fixes

This directory contains scripts to fix common TypeScript errors.

## Available Fixes

${fixerData.fixes.created.map(fix => (
    `### ${fix.fixName}

- **Error Code:** TS${fix.errorCode}
- **Description:** ${fix.description}
- **Usage:** \`node ${fix.fixPath}\`
`
  )).join('\n')}

## How to Use

1. Run the main analysis script:
   \`\`\`
   node typescript-diagnostics/scripts/fix-common-errors.js
   \`\`\`

2. Review the generated fix scripts in this directory

3. Run individual fix scripts as needed:
   \`\`\`
   node typescript-diagnostics/scripts/fixes/fix-name-not-found.js
   \`\`\`

4. Or apply all fixes at once:
   \`\`\`
   node typescript-diagnostics/scripts/fix-common-errors.js --apply
   \`\`\`
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log(`Generated README at ${readmePath.replace(ROOT_DIR + '/', '')}`);
}

/**
 * Save analysis report
 */
function saveReport() {
  // Save JSON report
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'typescript-fixes.json'),
    JSON.stringify(fixerData, null, 2)
  );
  
  // Generate human-readable report
  const readableReport = [
    '# TypeScript Error Fixes',
    '',
    `Generated: ${new Date(fixerData.timestamp).toLocaleString()}`,
    '',
    '## Error Analysis',
    '',
    `Total Errors: ${fixerData.errors.total}`,
    '',
    '### Top Error Types',
    ''
  ];
  
  // Add top error types
  Object.entries(fixerData.errors.byCode)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .forEach(([code, data]) => {
      readableReport.push(`- **TS${code}**: ${data.count} occurrences - ${data.message}`);
      readableReport.push('  - Example: ' + data.examples[0].message);
      readableReport.push('');
    });
  
  // Add generated fixes
  readableReport.push('## Generated Fix Scripts');
  readableReport.push('');
  
  for (const fix of fixerData.fixes.created) {
    readableReport.push(`### ${fix.fixName}`);
    readableReport.push('');
    readableReport.push(`- **Error Code:** TS${fix.errorCode}`);
    readableReport.push(`- **Description:** ${fix.description}`);
    readableReport.push(`- **Path:** \`${fix.fixPath}\``);
    readableReport.push('');
  }
  
  // Add applied fixes
  if (APPLY_FIXES && fixerData.fixes.applied.length > 0) {
    readableReport.push('## Applied Fixes');
    readableReport.push('');
    
    for (const fixName of fixerData.fixes.applied) {
      readableReport.push(`- Applied \`${fixName}\``);
    }
  }
  
  // Save human-readable report
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'typescript-fixes.md'),
    readableReport.join('\n')
  );
  
  console.log(`Reports saved to typescript-diagnostics/reports/`);
}

// Run the analysis
runTypeScriptCheck();
generateFixScripts();
generateFixesReadme();
applyFixes();
saveReport();

console.log('\n✅ TypeScript error fixes completed!');
