#!/usr/bin/env node

/**
 * TypeScript Diagnostic Tool
 * 
 * This script performs a comprehensive analysis of TypeScript issues in the codebase.
 * It identifies patterns, categorizes errors, and provides actionable insights.
 * 
 * Usage:
 *   node typescript-diagnostics/scripts/diagnose.js
 * 
 * Output:
 *   - Generates JSON reports in typescript-diagnostics/reports/
 *   - Provides console summary with key findings
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const REPORTS_DIR = path.resolve(ROOT_DIR, 'typescript-diagnostics/reports');
const ERRORS_LOG_FILE = path.join(ROOT_DIR, 'typescript-errors.log');
const DETAILED_REPORT_FILE = path.join(REPORTS_DIR, 'typescript-diagnostic-report.json');
const SUMMARY_REPORT_FILE = path.join(REPORTS_DIR, 'typescript-diagnostic-summary.json');

// Error categories and their patterns
const ERROR_CATEGORIES = {
  STRICT_NULL_CHECKS: [
    { code: 'TS2531', pattern: /Object is possibly 'null'/ },
    { code: 'TS2532', pattern: /Object is possibly 'undefined'/ },
    { code: 'TS2533', pattern: /Object is possibly 'null' or 'undefined'/ },
    { code: 'TS2322', pattern: /Type '[^']+' is not assignable to type '[^']+'\.\s+Type '[^']+' is not assignable to type 'null'/ }
  ],
  TYPE_DECLARATION: [
    { code: 'TS7006', pattern: /Parameter '[^']+' implicitly has an 'any' type/ },
    { code: 'TS7005', pattern: /Variable '[^']+' implicitly has an 'any' type/ },
    { code: 'TS7008', pattern: /Member '[^']+' implicitly has an 'any' type/ },
    { code: 'TS7031', pattern: /Binding element '[^']+' implicitly has an 'any' type/ }
  ],
  MODULE_SYSTEM: [
    { code: 'TS1259', pattern: /Module '[^']+' can only be default-imported/ },
    { code: 'TS1192', pattern: /Module '[^']+' has no default export/ },
    { code: 'TS2306', pattern: /File '[^']+' is not a module/ },
    { code: 'TS1479', pattern: /The current file is a CommonJS module/ }
  ],
  PROPERTY_ACCESS: [
    { code: 'TS2339', pattern: /Property '[^']+' does not exist on type/ },
    { code: 'TS2551', pattern: /Property '[^']+' does not exist on type '[^']+'\. Did you mean '[^']+'?/ },
    { code: 'TS2493', pattern: /This expression is not callable/ }
  ],
  TYPE_COMPATIBILITY: [
    { code: 'TS2345', pattern: /Argument of type '[^']+' is not assignable to parameter of type/ },
    { code: 'TS2352', pattern: /Conversion of type '[^']+' to type '[^']+' may be a mistake/ },
    { code: 'TS2740', pattern: /Type '[^']+' is missing the following properties from type/ }
  ],
  MISCELLANEOUS: []  // Catch-all for errors that don't fit in other categories
};

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

console.log('🔍 TypeScript Diagnostic Tool');
console.log('================================');

// Store all diagnostic data
const diagnosticData = {
  timestamp: new Date().toISOString(),
  typescriptVersion: '',
  totalFiles: 0,
  totalErrors: 0,
  errorCategories: {
    STRICT_NULL_CHECKS: { count: 0, errors: [] },
    TYPE_DECLARATION: { count: 0, errors: [] },
    MODULE_SYSTEM: { count: 0, errors: [] },
    PROPERTY_ACCESS: { count: 0, errors: [] },
    TYPE_COMPATIBILITY: { count: 0, errors: [] },
    MISCELLANEOUS: { count: 0, errors: [] }
  },
  errorsByFile: {},
  configIssues: [],
  moduleSystemIssues: [],
  strictModeViolations: [],
  typeDefinitionGaps: [],
  recommendations: []
};

/**
 * Run TypeScript compiler and capture errors
 */
function runTypeScriptCheck() {
  console.log('\n📊 Running TypeScript compiler check...');
  
  try {
    // Get TypeScript version
    const tscVersionOutput = execSync('npx tsc --version', { encoding: 'utf8' });
    diagnosticData.typescriptVersion = tscVersionOutput.trim();
    console.log(`Using ${diagnosticData.typescriptVersion}`);
    
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
 * Parse TypeScript error output and categorize issues
 */
function parseTypeScriptErrors(tscOutput) {
  const lines = tscOutput.split('\n');
  const errorPattern = /^(.+)\((\d+),(\d+)\): error TS(\d+): (.+)$/;
  const errorMap = {};
  
  // Process each line
  for (const line of lines) {
    const match = line.match(errorPattern);
    if (match) {
      const [_, filePath, line, column, errorCode, errorMessage] = match;
      
      // Count total errors
      diagnosticData.totalErrors++;
      
      // Categorize by error code
      if (!diagnosticData.errorCategories[errorCode]) {
        diagnosticData.errorCategories[errorCode] = {
          count: 0,
          message: errorMessage,
          examples: []
        };
      }
      
      diagnosticData.errorCategories[errorCode].count++;
      
      // Store up to 5 examples per error code
      if (diagnosticData.errorCategories[errorCode].examples.length < 5) {
        diagnosticData.errorCategories[errorCode].examples.push({
          file: filePath,
          line: parseInt(line),
          column: parseInt(column),
          message: errorMessage
        });
      }
      
      // Group by file
      const relativeFilePath = filePath.replace(ROOT_DIR + '/', '');
      if (!diagnosticData.errorsByFile[relativeFilePath]) {
        diagnosticData.errorsByFile[relativeFilePath] = [];
      }
      
      diagnosticData.errorsByFile[relativeFilePath].push({
        code: errorCode,
        line: parseInt(line),
        column: parseInt(column),
        message: errorMessage
      });
    }
  }
  
  // Count total files with errors
  diagnosticData.totalFiles = Object.keys(diagnosticData.errorsByFile).length;
  
  // Output summary
  console.log(`Found ${diagnosticData.totalErrors} TypeScript errors in ${diagnosticData.totalFiles} files.`);
  
  // Save detailed error report
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'typescript-errors.json'),
    JSON.stringify(diagnosticData, null, 2)
  );
  
  // Analyze error patterns
  analyzeErrorPatterns();
}

/**
 * Analyze TypeScript configuration files
 */
function analyzeTypeScriptConfigs() {
  console.log('\n🔧 Analyzing TypeScript configurations...');
  
  // Find all tsconfig files
  const tsconfigFiles = findFiles(ROOT_DIR, 'tsconfig*.json');
  
  const configAnalysis = {
    totalConfigs: tsconfigFiles.length,
    configs: [],
    inconsistencies: []
  };
  
  // Parse each config file
  for (const configPath of tsconfigFiles) {
    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);
      const relativeConfigPath = configPath.replace(ROOT_DIR + '/', '');
      
      configAnalysis.configs.push({
        path: relativeConfigPath,
        extends: config.extends,
        compilerOptions: config.compilerOptions
      });
      
      // Check for key compiler options
      const compilerOptions = config.compilerOptions || {};
      const missingOptions = [];
      
      // Check for critical options
      const criticalOptions = [
        'moduleResolution',
        'esModuleInterop',
        'strict',
        'target',
        'module'
      ];
      
      for (const option of criticalOptions) {
        if (compilerOptions[option] === undefined && !config.extends) {
          missingOptions.push(option);
        }
      }
      
      // Report inconsistencies
      if (missingOptions.length > 0) {
        configAnalysis.inconsistencies.push({
          config: relativeConfigPath,
          missingOptions
        });
      }
      
      // Check for module system inconsistencies
      if (compilerOptions.module && !['ESNext', 'ES2020', 'ES2022'].includes(compilerOptions.module)) {
        configAnalysis.inconsistencies.push({
          config: relativeConfigPath,
          issue: `Non-ESM module setting: ${compilerOptions.module}`
        });
      }
      
    } catch (error) {
      console.error(`Error parsing ${configPath}:`, error.message);
    }
  }
  
  console.log(`Analyzed ${configAnalysis.totalConfigs} TypeScript configurations.`);
  console.log(`Found ${configAnalysis.inconsistencies.length} configuration inconsistencies.`);
  
  // Save configuration analysis
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'tsconfig-analysis.json'),
    JSON.stringify(configAnalysis, null, 2)
  );
  
  // Add findings to diagnostic data
  diagnosticData.configIssues = configAnalysis.inconsistencies;
}

/**
 * Analyze package.json files for module system inconsistencies
 */
function analyzeModuleSystem() {
  console.log('\n📦 Analyzing module system configuration...');
  
  const packageJsonFiles = findFiles(ROOT_DIR, 'package.json');
  const moduleSystemAnalysis = {
    totalPackages: packageJsonFiles.length,
    packages: [],
    inconsistencies: []
  };
  
  // Root package.json type
  let rootType = null;
  
  // Parse each package.json
  for (const packagePath of packageJsonFiles) {
    try {
      const packageContent = fs.readFileSync(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      const relativePackagePath = packagePath.replace(ROOT_DIR + '/', '');
      
      // If this is the root package.json, remember its type
      if (relativePackagePath === 'package.json') {
        rootType = packageJson.type;
      }
      
      moduleSystemAnalysis.packages.push({
        path: relativePackagePath,
        type: packageJson.type,
        main: packageJson.main,
        module: packageJson.module,
        exports: packageJson.exports
      });
      
      // Check for inconsistencies
      if (relativePackagePath !== 'package.json' && packageJson.type && packageJson.type !== rootType) {
        moduleSystemAnalysis.inconsistencies.push({
          package: relativePackagePath,
          issue: `Module type '${packageJson.type}' differs from root '${rootType}'`
        });
      }
      
      // Check for missing exports field in ESM packages
      if (packageJson.type === 'module' && !packageJson.exports && packageJson.main) {
        moduleSystemAnalysis.inconsistencies.push({
          package: relativePackagePath,
          issue: 'ESM package is missing "exports" field'
        });
      }
    } catch (error) {
      console.error(`Error parsing ${packagePath}:`, error.message);
    }
  }
  
  console.log(`Analyzed ${moduleSystemAnalysis.totalPackages} package.json files.`);
  console.log(`Found ${moduleSystemAnalysis.inconsistencies.length} module system inconsistencies.`);
  
  // Save module system analysis
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'module-system-analysis.json'),
    JSON.stringify(moduleSystemAnalysis, null, 2)
  );
  
  // Add findings to diagnostic data
  diagnosticData.moduleSystemIssues = moduleSystemAnalysis.inconsistencies;
}

/**
 * Analyze import/export patterns across files
 */
function analyzeImportExports() {
  console.log('\n🔄 Analyzing import/export patterns...');
  
  const tsFiles = findFiles(ROOT_DIR, '.ts', ['node_modules', 'dist']);
  const importAnalysis = {
    totalFiles: tsFiles.length,
    importPatterns: {
      esm: 0,
      commonjs: 0,
      mixed: 0,
      dynamic: 0
    },
    exportPatterns: {
      esm: 0,
      commonjs: 0,
      mixed: 0,
      default: 0,
      named: 0
    },
    issues: []
  };
  
  // RegEx patterns
  const esmImportRegex = /import\s+(?:.+\s+from\s+)?['"](.+)['"]/g;
  const commonjsRequireRegex = /(?:const|let|var)\s+.+\s*=\s*require\(['"](.+)['"]\)/g;
  const esmExportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class|interface|type|enum|{)/g;
  const commonjsExportRegex = /(?:module\.exports|exports)\s*=/g;
  const dynamicImportRegex = /import\(\s*['"](.+)['"]\s*\)/g;
  
  // Process each file
  for (const filePath of tsFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativeFilePath = filePath.replace(ROOT_DIR + '/', '');
      
      // Check import patterns
      const hasEsmImports = content.match(esmImportRegex) !== null;
      const hasCommonjsRequires = content.match(commonjsRequireRegex) !== null;
      const hasDynamicImports = content.match(dynamicImportRegex) !== null;
      
      // Check export patterns
      const hasEsmExports = content.match(esmExportRegex) !== null;
      const hasCommonjsExports = content.match(commonjsExportRegex) !== null;
      
      // Count patterns
      if (hasEsmImports) importAnalysis.importPatterns.esm++;
      if (hasCommonjsRequires) importAnalysis.importPatterns.commonjs++;
      if (hasDynamicImports) importAnalysis.importPatterns.dynamic++;
      if (hasEsmExports) importAnalysis.exportPatterns.esm++;
      if (hasCommonjsExports) importAnalysis.exportPatterns.commonjs++;
      
      // Check for mixing import styles
      if (hasEsmImports && hasCommonjsRequires) {
        importAnalysis.importPatterns.mixed++;
        importAnalysis.issues.push({
          file: relativeFilePath,
          issue: 'Mixed ESM and CommonJS imports'
        });
      }
      
      // Check for mixing export styles
      if (hasEsmExports && hasCommonjsExports) {
        importAnalysis.exportPatterns.mixed++;
        importAnalysis.issues.push({
          file: relativeFilePath,
          issue: 'Mixed ESM and CommonJS exports'
        });
      }
      
    } catch (error) {
      console.error(`Error analyzing ${filePath}:`, error.message);
    }
  }
  
  console.log(`Analyzed imports/exports in ${importAnalysis.totalFiles} TypeScript files.`);
  console.log(`Found ${importAnalysis.issues.length} import/export issues.`);
  
  // Save import/export analysis
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'import-export-analysis.json'),
    JSON.stringify(importAnalysis, null, 2)
  );
}

/**
 * Analyze error patterns and generate recommendations
 */
function analyzeErrorPatterns() {
  console.log('\n🧠 Analyzing error patterns...');
  
  // Look for common patterns in the errors
  const commonPatterns = [
    {
      codes: ['2307'],
      pattern: "Cannot find module",
      recommendation: "Run 'pnpm install' to update dependencies and ensure type definitions are installed."
    },
    {
      codes: ['2322', '2345'],
      pattern: "Type '(.+)' is not assignable to type",
      recommendation: "Review type definitions and ensure proper types are used for variables and function parameters."
    },
    {
      codes: ['2339'],
      pattern: "Property '(.+)' does not exist on type",
      recommendation: "Add proper interface or type definitions for objects."
    },
    {
      codes: ['2304'],
      pattern: "Cannot find name '(.+)'",
      recommendation: "Ensure all variables are properly declared before use."
    },
    {
      codes: ['2531', '2532', '2533'],
      pattern: "Object is possibly 'null' or 'undefined'",
      recommendation: "Add null checks or use optional chaining (?.) and nullish coalescing (??) operators."
    },
    {
      codes: ['1378'],
      pattern: "Top-level 'await' expressions are only allowed",
      recommendation: "Ensure your tsconfig.json has 'module' set to 'ESNext' and 'target' to at least 'ES2017'."
    }
  ];
  
  // Check each pattern against our error categories
  for (const pattern of commonPatterns) {
    let matchCount = 0;
    
    for (const code of pattern.codes) {
      if (diagnosticData.errorCategories[code]) {
        matchCount += diagnosticData.errorCategories[code].count;
      }
    }
    
    if (matchCount > 0) {
      diagnosticData.recommendations.push({
        pattern: pattern.pattern,
        occurrences: matchCount,
        recommendation: pattern.recommendation
      });
    }
  }
  
  // Module system recommendations
  if (Object.values(diagnosticData.errorCategories).some(
    cat => cat.message && cat.message.includes('require')
  )) {
    diagnosticData.recommendations.push({
      pattern: "CommonJS usage in ESM context",
      recommendation: "Standardize on ES modules by replacing require() with import statements."
    });
  }
  
  // Add general recommendations
  diagnosticData.recommendations.push({
    pattern: "General TypeScript configuration",
    recommendation: "Standardize TypeScript configuration across all packages with a base tsconfig.json."
  });
  
  console.log(`Generated ${diagnosticData.recommendations.length} recommendations based on error patterns.`);
}

/**
 * Utility function to find files matching a pattern
 */
function findFiles(dir, pattern, excludeDirs = ['node_modules', 'dist']) {
  const results = [];
  
  function traverse(currentDir) {
    const files = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(currentDir, file.name);
      
      if (file.isDirectory()) {
        if (!excludeDirs.includes(file.name)) {
          traverse(fullPath);
        }
      } else if (file.isFile() && (
        // Handle different pattern types
        (typeof pattern === 'string' && file.name.includes(pattern)) || 
        (pattern instanceof RegExp && pattern.test(file.name))
      )) {
        results.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return results;
}

/**
 * Generate final summary report
 */
function generateSummaryReport() {
  console.log('\n📝 Generating summary report...');
  
  const summary = {
    timestamp: diagnosticData.timestamp,
    typescriptVersion: diagnosticData.typescriptVersion,
    totalErrors: diagnosticData.totalErrors,
    totalFilesWithErrors: diagnosticData.totalFiles,
    topErrorCategories: Object.entries(diagnosticData.errorCategories)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([code, data]) => ({
        code,
        count: data.count,
        message: data.message
      })),
    moduleSystemIssues: diagnosticData.moduleSystemIssues.length,
    configurationIssues: diagnosticData.configIssues.length,
    recommendations: diagnosticData.recommendations
  };
  
  // Save summary report
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'summary-report.json'),
    JSON.stringify(summary, null, 2)
  );
  
  // Generate human-readable report
  const readableReport = [
    '# TypeScript Diagnostic Summary',
    '',
    `Generated: ${new Date(summary.timestamp).toLocaleString()}`,
    `TypeScript Version: ${summary.typescriptVersion}`,
    '',
    '## Error Overview',
    '',
    `Total Errors: ${summary.totalErrors}`,
    `Files with Errors: ${summary.totalFilesWithErrors}`,
    '',
    '## Top Error Categories',
    ''
  ];
  
  summary.topErrorCategories.forEach(category => {
    readableReport.push(`- TS${category.code}: ${category.message} (${category.count} occurrences)`);
  });
  
  readableReport.push('');
  readableReport.push('## Configuration Issues');
  readableReport.push('');
  readableReport.push(`- Found ${summary.configurationIssues} TypeScript configuration issues`);
  readableReport.push(`- Found ${summary.moduleSystemIssues} module system inconsistencies`);
  readableReport.push('');
  readableReport.push('## Recommendations');
  readableReport.push('');
  
  summary.recommendations.forEach(rec => {
    readableReport.push(`### ${rec.pattern}`);
    readableReport.push('');
    readableReport.push(rec.recommendation);
    readableReport.push('');
  });
  
  // Save human-readable report
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'summary-report.md'),
    readableReport.join('\n')
  );
  
  console.log(`Summary report saved to typescript-diagnostics/reports/summary-report.md`);
}

// Run the diagnostics
runTypeScriptCheck();
analyzeTypeScriptConfigs();
analyzeModuleSystem();
analyzeImportExports();
generateSummaryReport();

console.log('\n✅ TypeScript diagnostics completed!');
console.log('Check the reports in typescript-diagnostics/reports/ for detailed information.');
