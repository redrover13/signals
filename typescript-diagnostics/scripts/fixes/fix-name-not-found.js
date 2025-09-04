/**
 * Script to fix common "Cannot find name X" errors in TypeScript
 */

const fs = require('fs');
const path = require('path');

// Common missing names and their imports
const COMMON_IMPORTS = {
  'React': "import React from 'react';",
  'useState': "import { useState } from 'react';",
  'useEffect': "import { useEffect } from 'react';",
  'useMemo': "import { useMemo } from 'react';",
  'useCallback': "import { useCallback } from 'react';",
  'useRef': "import { useRef } from 'react';",
  'map': "import { map } from 'lodash-es';",
  'filter': "import { filter } from 'lodash-es';",
  'forEach': "import { forEach } from 'lodash-es';",
  'find': "import { find } from 'lodash-es';",
  'isEqual': "import { isEqual } from 'lodash-es';"
};

// Function to fix a file
function fixNameNotFoundInFile(filePath) {
  console.log(`Checking file: ${filePath}`);
  
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
    return false;
  }
  
  // Check for missing names
  let modified = false;
  let importsToAdd = new Set();
  
  Object.keys(COMMON_IMPORTS).forEach(name => {
    // Only add import if the name is used but not already imported
    const nameRegex = new RegExp(`\\b${name}\\b`, 'g');
    const importRegex = new RegExp(`import.*\\b${name}\\b.*from`, 'g');
    
    if (nameRegex.test(content) && !importRegex.test(content)) {
      importsToAdd.add(COMMON_IMPORTS[name]);
      modified = true;
      console.log(`  Adding import for: ${name}`);
    }
  });
  
  // Add the imports to the beginning of the file
  if (importsToAdd.size > 0) {
    // Convert Set to Array and join with newlines
    const newImports = Array.from(importsToAdd).join('\n');
    
    // Check if the file already has imports
    if (/^import /m.test(content)) {
      // Add after the last import
      const lastImportIndex = content.lastIndexOf('import ');
      const nextLineAfterLastImport = content.indexOf('\n', lastImportIndex) + 1;
      content = content.slice(0, nextLineAfterLastImport) + newImports + '\n' + content.slice(nextLineAfterLastImport);
    } else {
      // Add to the beginning of the file
      content = newImports + '\n\n' + content;
    }
    
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ Updated file: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`  ❌ Error writing file ${filePath}: ${error.message}`);
      return false;
    }
  }
  
  return false;
}

// Function to process a list of files
function fixNameNotFoundErrors(fileList) {
  let fixedCount = 0;
  
  fileList.forEach(filePath => {
    if (fixNameNotFoundInFile(filePath)) {
      fixedCount++;
    }
  });
  
  console.log(`\nFixed "cannot find name" errors in ${fixedCount} files.`);
  return fixedCount;
}

module.exports = {
  fixNameNotFoundInFile,
  fixNameNotFoundErrors
};
