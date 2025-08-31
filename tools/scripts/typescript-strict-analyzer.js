#!/usr/bin/env node

/**
 * TypeScript Strict Mode Analyzer
 * 
 * This script analyzes TypeScript errors in the codebase and provides
 * recommendations for fixing common issues related to strict mode compliance.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ROOT_DIR = path.resolve(__dirname, '../..');
const ISSUES_OUTPUT_FILE = path.join(ROOT_DIR, 'typescript-issues.json');
const COMMON_ERRORS = {
  'Object is possibly undefined': {
    regex: /Object is possibly 'undefined'/,
    fixType: 'nullCheck'
  },
  'Parameter implicitly has an any type': {
    regex: /Parameter '([^']+)' implicitly has an 'any' type/,
    fixType: 'explicitType'
  },
  'Type has no index signature': {
    regex: /Element implicitly has an 'any' type because .+ has no index signature/,
    fixType: 'indexSignature'
  },
  'Property does not exist': {
    regex: /Property '([^']+)' does not exist on type/,
    fixType: 'propertyCheck'
  },
  'No overload matches this call': {
    regex: /No overload matches this call/,
    fixType: 'overloadFix'
  }
};

// Utility functions
const log = {
  info: (msg) => console.log(chalk.blue(`ℹ️ ${msg}`)),
  success: (msg) => console.log(chalk.green(`✅ ${msg}`)),
  warning: (msg) => console.log(chalk.yellow(`⚠️ ${msg}`)),
  error: (msg) => console.error(chalk.red(`❌ ${msg}`))
};

// Run TypeScript compiler to get errors
function getTypeScriptErrors() {
  log.info('Running TypeScript compiler to collect errors...');
  try {
    // Run TypeScript with JSON output for structured error data
    execSync('npx tsc --noEmit --skipLibCheck --pretty false --project tsconfig.base.json > typescript-errors.log', {
      cwd: ROOT_DIR,
      stdio: 'inherit'
    });
  } catch (error) {
    // Expected to fail if there are errors, continue processing
    log.warning('TypeScript compilation failed with errors (expected)');
    
    // Parse the error output to structured format
    const errors = parseTypeScriptErrors();
    fs.writeFileSync(ISSUES_OUTPUT_FILE, JSON.stringify(errors, null, 2));
    log.info(`Saved ${errors.length} TypeScript errors to ${ISSUES_OUTPUT_FILE}`);
    return errors;
  }
  
  log.success('TypeScript compilation succeeded with no errors!');
  return [];
}

// Parse TypeScript error output into structured format
function parseTypeScriptErrors() {
  const errorLog = fs.readFileSync(path.join(ROOT_DIR, 'typescript-errors.log'), 'utf8');
  const errorLines = errorLog.split('\n');
  
  const errors = [];
  let currentError = null;
  
  for (const line of errorLines) {
    // New error starts with a file path
    const errorMatch = line.match(/^(.+\.ts)\((\d+),(\d+)\):\s+error\s+TS(\d+):\s+(.+)$/);
    if (errorMatch) {
      if (currentError) {
        errors.push(currentError);
      }
      
      currentError = {
        filePath: errorMatch[1],
        line: parseInt(errorMatch[2], 10),
        column: parseInt(errorMatch[3], 10),
        code: `TS${errorMatch[4]}`,
        message: errorMatch[5],
        context: [],
        errorType: getErrorType(errorMatch[5])
      };
    } else if (currentError && line.trim() !== '') {
      // Add context to current error
      currentError.context.push(line);
    }
  }
  
  if (currentError) {
    errors.push(currentError);
  }
  
  return errors;
}

// Determine error type based on message
function getErrorType(message) {
  for (const [errorType, config] of Object.entries(COMMON_ERRORS)) {
    if (config.regex.test(message)) {
      return errorType;
    }
  }
  return 'unknown';
}

// Analyze errors by type and location
function analyzeErrors(errors) {
  log.info('Analyzing error patterns...');
  
  // Group by error type
  const errorsByType = {};
  errors.forEach(error => {
    if (!errorsByType[error.errorType]) {
      errorsByType[error.errorType] = [];
    }
    errorsByType[error.errorType].push(error);
  });
  
  // Group by file
  const errorsByFile = {};
  errors.forEach(error => {
    if (!errorsByFile[error.filePath]) {
      errorsByFile[error.filePath] = [];
    }
    errorsByFile[error.filePath].push(error);
  });
  
  // Find most common errors
  const errorTypeCounts = Object.entries(errorsByType)
    .map(([type, errs]) => ({ type, count: errs.length }))
    .sort((a, b) => b.count - a.count);
  
  // Find files with most errors
  const fileErrorCounts = Object.entries(errorsByFile)
    .map(([file, errs]) => ({ file, count: errs.length }))
    .sort((a, b) => b.count - a.count);
  
  return {
    total: errors.length,
    byType: errorsByType,
    byFile: errorsByFile,
    mostCommonErrors: errorTypeCounts,
    mostProblematicFiles: fileErrorCounts
  };
}

// Generate report with recommendations
function generateReport(analysis) {
  log.info('Generating report with recommendations...');
  
  const report = {
    summary: {
      totalErrors: analysis.total,
      errorTypes: analysis.mostCommonErrors.length,
      affectedFiles: analysis.mostProblematicFiles.length
    },
    recommendations: [],
    mostCommonErrors: analysis.mostCommonErrors.slice(0, 5),
    mostProblematicFiles: analysis.mostProblematicFiles.slice(0, 10)
  };
  
  // Add recommendations based on error types
  if (analysis.byType['Object is possibly undefined']?.length > 0) {
    report.recommendations.push({
      issue: 'Nullable variables access',
      recommendation: 'Add null checks or use optional chaining (obj?.prop) for nullable variables',
      example: `
// Before
function getName(user) {
  return user.name;
}

// After
function getName(user) {
  return user?.name;
}
      `
    });
  }
  
  if (analysis.byType['Parameter implicitly has an any type']?.length > 0) {
    report.recommendations.push({
      issue: 'Implicit any types',
      recommendation: 'Add explicit type annotations to all function parameters',
      example: `
// Before
function processUser(user) {
  return user.id;
}

// After
function processUser(user: User): string {
  return user.id;
}
      `
    });
  }
  
  if (analysis.byType['Property does not exist']?.length > 0) {
    report.recommendations.push({
      issue: 'Property access on undefined objects',
      recommendation: 'Use type guards and interface definitions to ensure properties exist',
      example: `
// Before
function getCity(data) {
  return data.address.city;
}

// After
interface Address {
  city: string;
}

interface User {
  address?: Address;
}

function getCity(data: User): string {
  if (data.address) {
    return data.address.city;
  }
  return 'Unknown';
}
      `
    });
  }
  
  const reportPath = path.join(ROOT_DIR, 'typescript-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log.success(`Report generated at ${reportPath}`);
  
  return report;
}

// Print report summary to console
function printReportSummary(report) {
  console.log('\n' + chalk.bold.underline('TypeScript Strict Mode Analysis'));
  console.log(`\nTotal errors: ${chalk.bold.red(report.summary.totalErrors)}`);
  console.log(`Affected files: ${chalk.bold.yellow(report.summary.affectedFiles)}`);
  console.log(`Error types: ${chalk.bold.blue(report.summary.errorTypes)}`);
  
  console.log('\n' + chalk.bold.underline('Most Common Error Types:'));
  report.mostCommonErrors.forEach(({ type, count }) => {
    console.log(`${chalk.yellow(type)}: ${chalk.bold(count)} occurrences`);
  });
  
  console.log('\n' + chalk.bold.underline('Most Problematic Files:'));
  report.mostProblematicFiles.forEach(({ file, count }) => {
    console.log(`${chalk.blue(file)}: ${chalk.bold(count)} errors`);
  });
  
  console.log('\n' + chalk.bold.underline('Recommendations:'));
  report.recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${chalk.bold(rec.issue)}`);
    console.log(`   ${rec.recommendation}`);
  });
  
  console.log('\n' + chalk.bold('For detailed error list, see:'));
  console.log(chalk.blue(ISSUES_OUTPUT_FILE));
  console.log(chalk.blue(path.join(ROOT_DIR, 'typescript-report.json')));
  console.log('\n' + chalk.bold('For detailed guidelines, see:'));
  console.log(chalk.blue(path.join(ROOT_DIR, 'docs/TYPESCRIPT_STRICT_GUIDELINES.md')));
}

// Main function
async function main() {
  try {
    log.info('Starting TypeScript strict mode analysis...');
    
    const errors = getTypeScriptErrors();
    if (errors.length === 0) {
      log.success('No TypeScript errors found!');
      return;
    }
    
    const analysis = analyzeErrors(errors);
    const report = generateReport(analysis);
    printReportSummary(report);
    
    log.info('Analysis complete.');
  } catch (error) {
    log.error(`An error occurred: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
