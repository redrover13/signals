#!/usr/bin/env node

/**
 * Lodash-ES Migration Analyzer
 *
 * This script specifically analyzes issues related to the migration from lodash to lodash-es.
 * It identifies problematic imports, usage patterns, and provides migration recommendations.
 *
 * Usage:
 *   node typescript-diagnostics/scripts/analyze-lodash-migration.js
 *
 * Output:
 *   - Generates JSON report in typescript-diagnostics/reports/
 *   - Provides console summary with key findings
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const REPORTS_DIR = path.resolve(ROOT_DIR, 'typescript-diagnostics/reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

console.log('🔍 Lodash-ES Migration Analyzer');
console.log('================================');

// Store all diagnostic data
const lodashAnalysis = {
  timestamp: new Date().toISOString(),
  totalFiles: 0,
  lodashImports: {
    commonjs: {
      count: 0,
      files: [],
    },
    esm: {
      count: 0,
      files: [],
    },
    mixed: {
      count: 0,
      files: [],
    },
  },
  importPatterns: {
    wholeLibrary: {
      count: 0,
      files: [],
    },
    individualFunctions: {
      count: 0,
      files: [],
    },
    mixedStyles: {
      count: 0,
      files: [],
    },
  },
  topLodashFunctions: {},
  recommendations: [],
};

/**
 * Find all TypeScript files in the project
 */
function findTsFiles() {
  console.log('\n📊 Finding TypeScript files...');

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
  lodashAnalysis.totalFiles = tsFiles.length;
  console.log(`Found ${tsFiles.length} TypeScript files`);

  return tsFiles;
}

/**
 * Analyze lodash imports in each file
 */
function analyzeLodashImports(tsFiles) {
  console.log('\n📦 Analyzing lodash imports...');

  // Regular expressions for different import styles
  const lodashCjsRegex =
    /(?:const|let|var)\s+(?:_|(?:{[^}]+}))\s*=\s*require\(['"]lodash(?:\/|['"]|$)/g;
  const lodashEsmRegex = /import\s+(?:_|(?:{[^}]+}))\s+from\s+['"]lodash(?:-es)?(?:\/|['"]|$)/g;
  const lodashIndividualEsmRegex = /import\s+{\s*([^}]+)\s*}\s+from\s+['"]lodash(?:-es)?['"]/g;
  const lodashIndividualCjsRegex =
    /(?:const|let|var)\s+{\s*([^}]+)\s*}\s*=\s*require\(['"]lodash(?:-es)?['"]\)/g;
  const lodashFunctionImportRegex = /import\s+([^\s]+)\s+from\s+['"]lodash(?:-es)?\/([^\s]+)['"]/g;
  const lodashFunctionRequireRegex =
    /(?:const|let|var)\s+([^\s=]+)\s*=\s*require\(['"]lodash(?:-es)?\/([^\s)]+)['"]\)/g;

  // Map to count used lodash functions
  const lodashFunctionsMap = new Map();

  // Analyze each file
  for (const filePath of tsFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativeFilePath = filePath.replace(ROOT_DIR + '/', '');

      // Check for different import styles
      const hasCjsImports =
        content.match(lodashCjsRegex) !== null ||
        content.match(lodashFunctionRequireRegex) !== null;
      const hasEsmImports =
        content.match(lodashEsmRegex) !== null || content.match(lodashFunctionImportRegex) !== null;

      // Check if importing whole library or individual functions
      const hasWholeLibraryImport =
        content.includes('import _ from') || content.includes('const _ = require');
      const hasIndividualImports =
        content.match(lodashIndividualEsmRegex) !== null ||
        content.match(lodashIndividualCjsRegex) !== null ||
        content.match(lodashFunctionImportRegex) !== null ||
        content.match(lodashFunctionRequireRegex) !== null;

      // Categorize the file
      if (hasCjsImports && hasEsmImports) {
        lodashAnalysis.lodashImports.mixed.count++;
        lodashAnalysis.lodashImports.mixed.files.push(relativeFilePath);
      } else if (hasCjsImports) {
        lodashAnalysis.lodashImports.commonjs.count++;
        lodashAnalysis.lodashImports.commonjs.files.push(relativeFilePath);
      } else if (hasEsmImports) {
        lodashAnalysis.lodashImports.esm.count++;
        lodashAnalysis.lodashImports.esm.files.push(relativeFilePath);
      }

      // Categorize import style
      if (hasWholeLibraryImport && hasIndividualImports) {
        lodashAnalysis.importPatterns.mixedStyles.count++;
        lodashAnalysis.importPatterns.mixedStyles.files.push(relativeFilePath);
      } else if (hasWholeLibraryImport) {
        lodashAnalysis.importPatterns.wholeLibrary.count++;
        lodashAnalysis.importPatterns.wholeLibrary.files.push(relativeFilePath);
      } else if (hasIndividualImports) {
        lodashAnalysis.importPatterns.individualFunctions.count++;
        lodashAnalysis.importPatterns.individualFunctions.files.push(relativeFilePath);
      }

      // Extract and count individual lodash functions
      let match;

      // From individual imports
      const individualImportMatches = content.match(lodashIndividualEsmRegex) || [];
      for (const importStatement of individualImportMatches) {
        const functionMatches = importStatement.match(/{\s*([^}]+)\s*}/) || [];
        if (functionMatches[1]) {
          const functions = functionMatches[1].split(',').map((f) => f.trim());
          for (const func of functions) {
            const cleanFunc = func.split(' as ')[0].trim();
            lodashFunctionsMap.set(cleanFunc, (lodashFunctionsMap.get(cleanFunc) || 0) + 1);
          }
        }
      }

      // From individual CJS imports
      const individualCjsMatches = content.match(lodashIndividualCjsRegex) || [];
      for (const importStatement of individualCjsMatches) {
        const functionMatches = importStatement.match(/{\s*([^}]+)\s*}/) || [];
        if (functionMatches[1]) {
          const functions = functionMatches[1].split(',').map((f) => f.trim());
          for (const func of functions) {
            const cleanFunc = func.split(':')[0].trim();
            lodashFunctionsMap.set(cleanFunc, (lodashFunctionsMap.get(cleanFunc) || 0) + 1);
          }
        }
      }

      // From direct function imports
      while ((match = lodashFunctionImportRegex.exec(content)) !== null) {
        const funcName = match[2];
        lodashFunctionsMap.set(funcName, (lodashFunctionsMap.get(funcName) || 0) + 1);
      }

      // From direct function requires
      while ((match = lodashFunctionRequireRegex.exec(content)) !== null) {
        const funcName = match[2];
        lodashFunctionsMap.set(funcName, (lodashFunctionsMap.get(funcName) || 0) + 1);
      }

      // Count usage of _ directly when whole library is imported
      if (hasWholeLibraryImport) {
        const usagePattern = /(?<![a-zA-Z0-9_])_\.([a-zA-Z0-9]+)/g;
        while ((match = usagePattern.exec(content)) !== null) {
          const funcName = match[1];
          lodashFunctionsMap.set(funcName, (lodashFunctionsMap.get(funcName) || 0) + 1);
        }
      }
    } catch (error) {
      console.error(`Error analyzing ${filePath}:`, error.message);
    }
  }

  // Sort lodash functions by usage count
  lodashAnalysis.topLodashFunctions = Array.from(lodashFunctionsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .reduce((obj, [func, count]) => {
      obj[func] = count;
      return obj;
    }, {});

  console.log(
    `Found ${lodashAnalysis.lodashImports.commonjs.count} files with CommonJS lodash imports`,
  );
  console.log(`Found ${lodashAnalysis.lodashImports.esm.count} files with ESM lodash imports`);
  console.log(`Found ${lodashAnalysis.lodashImports.mixed.count} files with mixed lodash imports`);
}

/**
 * Analyze package.json for lodash dependencies
 */
function analyzeLodashDependencies() {
  console.log('\n📝 Analyzing lodash dependencies in package.json files...');

  const packageJsonFiles = [];

  function findPackageJsonFiles(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dir, file.name);

      if (file.isDirectory()) {
        if (file.name !== 'node_modules' && file.name !== 'dist' && !file.name.startsWith('.')) {
          findPackageJsonFiles(fullPath);
        }
      } else if (file.isFile() && file.name === 'package.json') {
        packageJsonFiles.push(fullPath);
      }
    }
  }

  findPackageJsonFiles(ROOT_DIR);

  const dependencyAnalysis = {
    totalPackages: packageJsonFiles.length,
    packagesWithLodash: 0,
    packagesWithLodashEs: 0,
    packagesWithBoth: 0,
    packagesWithLodashTypes: 0,
    inconsistencies: [],
  };

  // Analyze each package.json
  for (const packagePath of packageJsonFiles) {
    try {
      const content = fs.readFileSync(packagePath, 'utf8');
      const packageJson = JSON.parse(content);
      const relativePackagePath = packagePath.replace(ROOT_DIR + '/', '');

      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      const hasLodash = !!deps.lodash;
      const hasLodashEs = !!deps['lodash-es'];
      const hasLodashTypes = !!deps['@types/lodash'] || !!deps['@types/lodash-es'];

      if (hasLodash) dependencyAnalysis.packagesWithLodash++;
      if (hasLodashEs) dependencyAnalysis.packagesWithLodashEs++;
      if (hasLodashTypes) dependencyAnalysis.packagesWithLodashTypes++;

      if (hasLodash && hasLodashEs) {
        dependencyAnalysis.packagesWithBoth++;
        dependencyAnalysis.inconsistencies.push({
          package: relativePackagePath,
          issue: 'Has both lodash and lodash-es dependencies',
        });
      }

      if (hasLodashEs && !hasLodashTypes) {
        dependencyAnalysis.inconsistencies.push({
          package: relativePackagePath,
          issue: 'Using lodash-es without @types/lodash-es',
        });
      }
    } catch (error) {
      console.error(`Error analyzing ${packagePath}:`, error.message);
    }
  }

  lodashAnalysis.dependencies = dependencyAnalysis;

  console.log(`Analyzed ${dependencyAnalysis.totalPackages} package.json files`);
  console.log(`Found ${dependencyAnalysis.packagesWithLodash} packages with lodash dependency`);
  console.log(
    `Found ${dependencyAnalysis.packagesWithLodashEs} packages with lodash-es dependency`,
  );
  console.log(`Found ${dependencyAnalysis.packagesWithBoth} packages with both dependencies`);
}

/**
 * Generate migration recommendations
 */
function generateRecommendations() {
  console.log('\n🧠 Generating migration recommendations...');

  // Add recommendations based on analysis

  // 1. Package.json recommendations
  if (lodashAnalysis.dependencies.packagesWithBoth > 0) {
    lodashAnalysis.recommendations.push({
      title: 'Remove duplicate lodash dependencies',
      description:
        "Some package.json files have both 'lodash' and 'lodash-es' listed as dependencies. Remove the 'lodash' dependency to standardize on lodash-es.",
      implementation: `
      // Remove lodash dependency in package.json
      "dependencies": {
        // remove this line
        "lodash": "^4.x.x",
        // keep only this line
        "lodash-es": "^4.x.x"
      }
      `,
    });
  }

  if (
    lodashAnalysis.dependencies.packagesWithLodashEs > 0 &&
    lodashAnalysis.dependencies.packagesWithLodashTypes <
      lodashAnalysis.dependencies.packagesWithLodashEs
  ) {
    lodashAnalysis.recommendations.push({
      title: 'Add lodash-es type definitions',
      description:
        "Add '@types/lodash-es' to devDependencies for projects using lodash-es to ensure proper TypeScript support.",
      implementation: `
      // Add type definitions in package.json
      "devDependencies": {
        "@types/lodash-es": "^4.17.x"
      }
      `,
    });
  }

  // 2. Import style recommendations
  if (lodashAnalysis.lodashImports.commonjs.count > 0) {
    lodashAnalysis.recommendations.push({
      title: 'Convert CommonJS lodash imports to ESM',
      description: 'Replace require() statements with import syntax for lodash-es.',
      implementation: `
      // BEFORE - CommonJS
      const _ = require('lodash');
      const { map, filter } = require('lodash');
      
      // AFTER - ESM
      import _ from 'lodash-es';
      import { map, filter } from 'lodash-es';
      `,
    });
  }

  if (lodashAnalysis.importPatterns.wholeLibrary.count > 0) {
    lodashAnalysis.recommendations.push({
      title: 'Use specific lodash-es imports for better tree-shaking',
      description:
        'Import only the functions you need from lodash-es instead of the whole library.',
      implementation: `
      // BEFORE - Importing entire library
      import _ from 'lodash-es';
      
      // Usage
      _.map(items, item => item.id);
      _.filter(items, item => item.active);
      
      // AFTER - Importing specific functions
      import { map, filter } from 'lodash-es';
      
      // Usage
      map(items, item => item.id);
      filter(items, item => item.active);
      `,
    });
  }

  if (lodashAnalysis.lodashImports.mixed.count > 0) {
    lodashAnalysis.recommendations.push({
      title: 'Standardize mixed lodash import styles',
      description:
        'Files with mixed import styles (both CommonJS and ESM) should be standardized to use only ESM imports.',
      implementation: `
      // BEFORE - Mixed styles
      import { map } from 'lodash-es';
      const { filter } = require('lodash');
      
      // AFTER - Standardized to ESM
      import { map, filter } from 'lodash-es';
      `,
    });
  }

  // 3. General recommendations
  lodashAnalysis.recommendations.push({
    title: 'Use a codemod for automated migration',
    description:
      'Consider using a codemod tool to automate the migration from lodash to lodash-es.',
    implementation: `
    # Example using jscodeshift with a custom transform
    npx jscodeshift -t transform-lodash-imports.js ./src
    
    # Or a more manual approach with search and replace
    find ./src -type f -name "*.ts" | xargs sed -i 's/require([\'"]lodash[\'"]);/import _ from "lodash-es";/g'
    `,
  });

  lodashAnalysis.recommendations.push({
    title: 'Update tsconfig.json for proper ESM support',
    description: 'Ensure your TypeScript configuration properly supports ES modules.',
    implementation: `
    // In tsconfig.json
    {
      "compilerOptions": {
        "module": "ESNext",
        "moduleResolution": "NodeNext",
        "esModuleInterop": true
      }
    }
    `,
  });

  console.log(`Generated ${lodashAnalysis.recommendations.length} migration recommendations`);
}

/**
 * Save analysis report
 */
function saveReport() {
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'lodash-migration-analysis.json'),
    JSON.stringify(lodashAnalysis, null, 2),
  );

  // Generate human-readable report
  const readableReport = [
    '# Lodash-ES Migration Analysis',
    '',
    `Generated: ${new Date(lodashAnalysis.timestamp).toLocaleString()}`,
    '',
    '## Import Analysis',
    '',
    `Total TypeScript Files: ${lodashAnalysis.totalFiles}`,
    `Files with CommonJS lodash imports: ${lodashAnalysis.lodashImports.commonjs.count}`,
    `Files with ESM lodash imports: ${lodashAnalysis.lodashImports.esm.count}`,
    `Files with mixed lodash imports: ${lodashAnalysis.lodashImports.mixed.count}`,
    '',
    '## Import Patterns',
    '',
    `Files importing whole lodash library: ${lodashAnalysis.importPatterns.wholeLibrary.count}`,
    `Files importing individual lodash functions: ${lodashAnalysis.importPatterns.individualFunctions.count}`,
    `Files with mixed import styles: ${lodashAnalysis.importPatterns.mixedStyles.count}`,
    '',
    '## Dependencies',
    '',
    `Packages with lodash dependency: ${lodashAnalysis.dependencies.packagesWithLodash}`,
    `Packages with lodash-es dependency: ${lodashAnalysis.dependencies.packagesWithLodashEs}`,
    `Packages with both dependencies: ${lodashAnalysis.dependencies.packagesWithBoth}`,
    `Packages with lodash types: ${lodashAnalysis.dependencies.packagesWithLodashTypes}`,
    '',
    '## Top Lodash Functions Used',
    '',
  ];

  // Add top functions
  Object.entries(lodashAnalysis.topLodashFunctions).forEach(([func, count]) => {
    readableReport.push(`- \`${func}\`: ${count} occurrences`);
  });

  // Add recommendations
  readableReport.push('');
  readableReport.push('## Migration Recommendations');
  readableReport.push('');

  lodashAnalysis.recommendations.forEach((rec, index) => {
    readableReport.push(`### ${index + 1}. ${rec.title}`);
    readableReport.push('');
    readableReport.push(rec.description);
    readableReport.push('');
    readableReport.push('```javascript');
    readableReport.push(rec.implementation.trim());
    readableReport.push('```');
    readableReport.push('');
  });

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'lodash-migration-analysis.md'),
    readableReport.join('\n'),
  );

  console.log(`Reports saved to typescript-diagnostics/reports/`);
}

// Run the analysis
const tsFiles = findTsFiles();
analyzeLodashImports(tsFiles);
analyzeLodashDependencies();
generateRecommendations();
saveReport();

console.log('\n✅ Lodash-ES migration analysis completed!');
