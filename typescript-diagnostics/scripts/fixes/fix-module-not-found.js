/**
 * Script to fix common "Cannot find module" errors in TypeScript
 */

const fs = require('fs');
const path = require('path');

// Common module import paths that need to be fixed
const IMPORT_PATH_FIXES = [
  { 
    find: /from ['"]lodash['"]/g, 
    replace: "from 'lodash-es'"
  },
  // Add more common import path fixes here
];

// Function to fix a file
function fixModuleNotFoundInFile(filePath) {
  console.log(`Checking file: ${filePath}`);
  
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
    return false;
  }
  
  let modified = false;
  let newContent = content;
  
  // Apply each fix
  IMPORT_PATH_FIXES.forEach(fix => {
    if (fix.find.test(newContent)) {
      newContent = newContent.replace(fix.find, fix.replace);
      modified = true;
      console.log(`  Applied fix: ${fix.find} -> ${fix.replace}`);
    }
  });
  
  // If the content was modified, write it back to the file
  if (modified) {
    try {
      fs.writeFileSync(filePath, newContent, 'utf8');
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
function fixModuleNotFoundErrors(fileList) {
  let fixedCount = 0;
  
  fileList.forEach(filePath => {
    if (fixModuleNotFoundInFile(filePath)) {
      fixedCount++;
    }
  });
  
  console.log(`\nFixed module not found errors in ${fixedCount} files.`);
  return fixedCount;
}

module.exports = {
  fixModuleNotFoundInFile,
  fixModuleNotFoundErrors
};
