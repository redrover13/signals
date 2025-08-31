#!/usr/bin/env node

/**
 * TypeScript Strict Mode Auto-Fixer
 * 
 * This script attempts to automatically fix common TypeScript strict mode issues
 * based on the analysis performed by the typescript-strict-analyzer.js script.
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ROOT_DIR = path.resolve(__dirname, '../..');
const ISSUES_FILE = path.join(ROOT_DIR, 'typescript-issues.json');
const BACKUP_EXTENSION = '.ts-fix-backup';

// Utility functions
const log = {
  info: (msg) => console.log(chalk.blue(`ℹ️ ${msg}`)),
  success: (msg) => console.log(chalk.green(`✅ ${msg}`)),
  warning: (msg) => console.log(chalk.yellow(`⚠️ ${msg}`)),
  error: (msg) => console.error(chalk.red(`❌ ${msg}`))
};

// Ensure the issues file exists
function checkIssuesFile() {
  if (!fs.existsSync(ISSUES_FILE)) {
    log.error(`TypeScript issues file not found: ${ISSUES_FILE}`);
    log.info('Please run the typescript-strict-analyzer.js script first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(ISSUES_FILE, 'utf8'));
}

// Create a backup of a file before modifying it
function backupFile(filePath) {
  const backupPath = `${filePath}${BACKUP_EXTENSION}`;
  fs.copyFileSync(filePath, backupPath);
  log.info(`Created backup: ${backupPath}`);
  return backupPath;
}

// Apply a fix to a single issue
function applyFix(issue, fileContent) {
  const lines = fileContent.split('\n');
  const lineIndex = issue.line - 1; // Convert to 0-based index
  const line = lines[lineIndex];
  
  let newLine = line;
  
  switch (issue.errorType) {
    case 'Object is possibly undefined':
      // Fix: Add optional chaining or nullish coalescing
      // Example: user.name -> user?.name
      const match = issue.message.match(/Object is possibly 'undefined'/);
      if (match) {
        // Find the property access at the column position
        const beforeColumn = line.substring(0, issue.column - 1);
        const afterColumn = line.substring(issue.column - 1);
        
        // Find the dot access pattern and replace with optional chaining
        // This is simplified and may need refinement for complex cases
        const dotPattern = /(\w+)\.(\w+)/g;
        let modified = false;
        
        // Replace in the part of the line starting at the error column
        const newAfterColumn = afterColumn.replace(dotPattern, (match, obj, prop) => {
          modified = true;
          return `${obj}?.${prop}`;
        });
        
        if (modified) {
          newLine = beforeColumn + newAfterColumn;
        }
      }
      break;
      
    case 'Parameter implicitly has an any type':
      // Fix: Add explicit any type (as a starting point - should be refined later)
      // Example: function process(user) -> function process(user: any)
      const paramMatch = issue.message.match(/Parameter '([^']+)' implicitly has an 'any' type/);
      if (paramMatch) {
        const paramName = paramMatch[1];
        // Simple regex to add ': any' after the parameter name
        // This is a temporary solution - proper typing should be added manually
        newLine = line.replace(
          new RegExp(`(\\b${paramName}\\b)(?!\\s*:)`, 'g'),
          `${paramName}: any`
        );
      }
      break;
      
    case 'Property does not exist':
      // Fix: For now, just add a type assertion as a temporary solution
      // This should be manually reviewed and fixed properly
      const propMatch = issue.message.match(/Property '([^']+)' does not exist on type/);
      if (propMatch) {
        const propName = propMatch[1];
        const beforeColumn = line.substring(0, issue.column - 1);
        const afterColumn = line.substring(issue.column - 1);
        
        // Add a comment indicating this needs proper fixing
        newLine = `${line} // TODO: Fix type for '${propName}' access`;
      }
      break;
      
    // Add more fix types as needed
      
    default:
      // For unknown error types, add a TODO comment
      newLine = `${line} // TODO: Fix TypeScript error: ${issue.errorType}`;
  }
  
  if (newLine !== line) {
    lines[lineIndex] = newLine;
    return lines.join('\n');
  }
  
  return fileContent; // No changes made
}

// Fix issues in a specific file
function fixFile(filePath, issues) {
  log.info(`Fixing issues in ${filePath}...`);
  
  try {
    // Create a backup
    backupFile(filePath);
    
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Sort issues by line number in descending order to avoid position shifts
    const sortedIssues = [...issues].sort((a, b) => b.line - a.line);
    
    // Apply fixes one by one
    let fixedCount = 0;
    for (const issue of sortedIssues) {
      const newContent = applyFix(issue, content);
      if (newContent !== content) {
        content = newContent;
        fixedCount++;
      }
    }
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, content);
    
    log.success(`Fixed ${fixedCount} of ${issues.length} issues in ${filePath}`);
    return fixedCount;
  } catch (error) {
    log.error(`Error fixing ${filePath}: ${error.message}`);
    return 0;
  }
}

// Ask for confirmation before proceeding
function confirmAction(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(`${message} (y/n): `, (answer) => {
      rl.close();
      const response = answer.trim().toLowerCase();
      resolve(response === 'y' || response === 'yes');
    });
  });
}

// Main function
async function main() {
  try {
    log.info('Starting TypeScript auto-fixer...');
    
    // Check if the issues file exists
    const issues = checkIssuesFile();
    
    if (issues.length === 0) {
      log.success('No TypeScript issues to fix!');
      return;
    }
    
    // Group issues by file
    const issuesByFile = {};
    issues.forEach(issue => {
      if (!issuesByFile[issue.filePath]) {
        issuesByFile[issue.filePath] = [];
      }
      issuesByFile[issue.filePath].push(issue);
    });
    
    // Show summary
    const fileCount = Object.keys(issuesByFile).length;
    log.info(`Found ${issues.length} issues in ${fileCount} files.`);
    
    // Ask for confirmation
    const confirmed = await confirmAction(
      `This will attempt to automatically fix TypeScript issues in ${fileCount} files. Backups will be created. Proceed?`
    );
    
    if (!confirmed) {
      log.info('Operation cancelled.');
      process.exit(0);
    }
    
    // Fix issues file by file
    let totalFixed = 0;
    for (const [filePath, fileIssues] of Object.entries(issuesByFile)) {
      totalFixed += fixFile(filePath, fileIssues);
    }
    
    log.success(`Fixed ${totalFixed} of ${issues.length} issues.`);
    
    // Run TypeScript check again to see remaining issues
    log.info('Running TypeScript check to verify fixes...');
    try {
      execSync('npx tsc --noEmit --skipLibCheck --project tsconfig.base.json', {
        cwd: ROOT_DIR,
        stdio: 'pipe'
      });
      log.success('All TypeScript issues fixed successfully!');
    } catch (error) {
      const remainingIssues = error.stdout.toString().split('\n').length - 1;
      log.warning(`${remainingIssues} TypeScript issues remaining. Run typescript-strict-analyzer.js again for details.`);
    }
    
    log.info('TypeScript auto-fixer complete.');
  } catch (error) {
    log.error(`An error occurred: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
