/**
 * TypeScript strict validation script
 * This script checks if the codebase complies with strict TypeScript rules
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Output formatting
const error = (msg) => console.error(chalk.red(`❌ Error: ${msg}`));
const success = (msg) => console.log(chalk.green(`✅ ${msg}`));
const info = (msg) => console.log(chalk.blue(`ℹ️ ${msg}`));
const warning = (msg) => console.log(chalk.yellow(`⚠️ ${msg}`));

// Configuration
const IGNORE_PATTERNS = [
  'node_modules',
  'dist',
  '.git',
  'coverage',
  'tmp',
];

// Find TypeScript configuration files
function findTsConfigs() {
  try {
    const tsConfigFiles = execSync('find . -name "tsconfig*.json" -not -path "*/node_modules/*" -not -path "*/dist/*"')
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);
    
    return tsConfigFiles;
  } catch (err) {
    error('Failed to find TypeScript configuration files');
    console.error(err);
    process.exit(1);
  }
}

// Check for strict mode in TypeScript configs
function checkTsConfigsForStrictMode(tsConfigFiles) {
  let allStrict = true;
  const nonStrictConfigs = [];

  tsConfigFiles.forEach(configPath => {
    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(
        // Remove comments from JSON
        configContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
      );
      
      // Check for strict mode
      const hasStrict = config.compilerOptions && config.compilerOptions.strict === true;
      const hasStrictNullChecks = config.compilerOptions && config.compilerOptions.strictNullChecks === true;
      
      if (!hasStrict && !hasStrictNullChecks) {
        allStrict = false;
        nonStrictConfigs.push(configPath);
      }
    } catch (err) {
      warning(`Failed to parse ${configPath}: ${err.message}`);
    }
  });

  return { allStrict, nonStrictConfigs };
}

// Run TypeScript compiler in noEmit mode to check for errors
function runTypeCheck() {
  try {
    info('Running TypeScript type check...');
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'inherit' });
    success('TypeScript type check passed');
    return true;
  } catch (err) {
    error('TypeScript type check failed');
    return false;
  }
}

// Run the validation
function validateTypeScriptStrict() {
  info('Validating TypeScript strict mode configuration...');
  
  const tsConfigFiles = findTsConfigs();
  info(`Found ${tsConfigFiles.length} TypeScript configuration files`);
  
  const { allStrict, nonStrictConfigs } = checkTsConfigsForStrictMode(tsConfigFiles);
  
  if (!allStrict) {
    warning('Some TypeScript configuration files are not using strict mode:');
    nonStrictConfigs.forEach(config => console.log(`  - ${config}`));
  } else {
    success('All TypeScript configuration files are using strict mode');
  }
  
  const typeCheckPassed = runTypeCheck();
  
  if (typeCheckPassed) {
    success('TypeScript strict validation complete - all checks passed');
    return 0;
  } else {
    error('TypeScript strict validation failed - type check found errors');
    return 1;
  }
}

// Run the script
process.exit(validateTypeScriptStrict());
