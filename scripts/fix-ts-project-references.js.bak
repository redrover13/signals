#!/usr/bin/env node

/**
 * This script fixes common issues with TypeScript Project References in the monorepo
 *
 * Issues addressed:
 * 1. Missing "include" patterns in tsconfig files
 * 2. Improper "exclude" patterns
 * 3. Missing "references" between interdependent projects
 * 4. Fixing composite settings
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Get all tsconfig files in the project
function getAllTsConfigFiles() {
  return glob.sync('**/tsconfig*.json', {
    cwd: ROOT_DIR,
    ignore: ['**/node_modules/**', '**/dist/**', '**/tmp/**'],
  });
}

// Process each tsconfig file
function processAllTsConfigs() {
  const allFiles = getAllTsConfigFiles();
  console.log(`Found ${allFiles.length} tsconfig files to process`);

  allFiles.forEach((filePath) => {
    const fullPath = path.join(ROOT_DIR, filePath);
    processFile(fullPath, filePath);
  });
}

// Process a single tsconfig file
function processFile(fullPath, relativePath) {
  console.log(`Processing ${relativePath}`);

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const config = JSON.parse(content);

    let modified = false;

    // Fix include patterns if missing
    if (!config.include || config.include.length === 0) {
      // Determine the right include pattern based on the file location
      const isLibConfig = relativePath.includes('/libs/');
      const isAppConfig = relativePath.includes('/apps/');

      if (relativePath.includes('tsconfig.lib.json')) {
        config.include = ['**/*.ts', '**/*.tsx'];
        modified = true;
      } else if (relativePath.includes('tsconfig.app.json')) {
        config.include = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];
        modified = true;
      } else if (isLibConfig || isAppConfig) {
        // Main tsconfig in a library or app
        config.include = ['**/*.ts', '**/*.tsx'];
        modified = true;
      }
    }

    // Add src folder to include if not present for lib configs
    if (
      config.include &&
      relativePath.includes('tsconfig.lib.json') &&
      !config.include.includes('src/**/*')
    ) {
      config.include.push('src/**/*');
      modified = true;
    }

    // Fix exclude patterns
    if (!config.exclude) {
      config.exclude = ['node_modules', 'tmp', 'dist'];
      modified = true;
    }

    // Ensure composite is true for libraries
    if (
      relativePath.includes('/libs/') &&
      config.compilerOptions &&
      config.compilerOptions.composite !== true
    ) {
      config.compilerOptions.composite = true;
      modified = true;
    }

    // Ensure declarationMap is true for composite projects
    if (
      config.compilerOptions &&
      config.compilerOptions.composite === true &&
      config.compilerOptions.declarationMap !== true
    ) {
      config.compilerOptions.declarationMap = true;
      modified = true;
    }

    // Write back if modified
    if (modified) {
      fs.writeFileSync(fullPath, JSON.stringify(config, null, 2), 'utf8');
      console.log(`  Updated ${relativePath}`);
    } else {
      console.log(`  No changes needed for ${relativePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${relativePath}:`, error.message);
  }
}

// Generate references between projects
async function generateProjectReferences() {
  // Get all lib and app directories
  const libDirs = glob.sync('libs/*/', { cwd: ROOT_DIR });
  const appDirs = glob.sync('apps/*/', { cwd: ROOT_DIR });

  console.log(`Found ${libDirs.length} libraries and ${appDirs.length} applications`);

  // Create a map of project directories to their package.json dependencies
  const projectDeps = {};

  // Process libs
  libDirs.forEach((dir) => {
    const packageJsonPath = path.join(ROOT_DIR, dir, 'package.json');
    try {
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        projectDeps[dir] = {
          dependencies: packageJson.dependencies || {},
          peerDependencies: packageJson.peerDependencies || {},
          devDependencies: packageJson.devDependencies || {},
        };
      }
    } catch (error) {
      console.error(`Error processing ${packageJsonPath}:`, error.message);
    }
  });

  // Process apps
  appDirs.forEach((dir) => {
    const packageJsonPath = path.join(ROOT_DIR, dir, 'package.json');
    try {
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        projectDeps[dir] = {
          dependencies: packageJson.dependencies || {},
          peerDependencies: packageJson.peerDependencies || {},
          devDependencies: packageJson.devDependencies || {},
        };
      }
    } catch (error) {
      console.error(`Error processing ${packageJsonPath}:`, error.message);
    }
  });

  // Function to create references for a project
  function createReferencesForProject(projectDir) {
    const tsConfigPath = path.join(ROOT_DIR, projectDir, 'tsconfig.json');
    if (!fs.existsSync(tsConfigPath)) {
      return;
    }

    try {
      const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));

      // Find dependencies that are internal projects
      const deps = projectDeps[projectDir];
      if (!deps) {
        return;
      }

      const allDeps = { ...deps.dependencies, ...deps.peerDependencies };
      const references = [];

      // For each lib, check if this project depends on it
      libDirs.forEach((libDir) => {
        const libName = libDir.replace('libs/', '').replace('/', '');
        // Check both @namespace/lib format and direct lib name
        if (allDeps[`@dulcesaigon/${libName}`] || allDeps[libName]) {
          // Create a reference to this lib
          const refPath = path.relative(path.dirname(tsConfigPath), path.join(ROOT_DIR, libDir));
          references.push({ path: refPath });
        }
      });

      // Only update if there are references to add and they don't already exist
      if (references.length > 0) {
        tsConfig.references = references;
        fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2), 'utf8');
        console.log(`Added ${references.length} references to ${projectDir}tsconfig.json`);
      }
    } catch (error) {
      console.error(`Error updating references for ${projectDir}:`, error.message);
    }
  }

  // Create references for all projects
  console.log('Generating project references...');

  // First process libraries
  libDirs.forEach((dir) => {
    createReferencesForProject(dir);
  });

  // Then process apps
  appDirs.forEach((dir) => {
    createReferencesForProject(dir);
  });
}

// Main function
async function main() {
  console.log('Fixing TypeScript Project References...');
  processAllTsConfigs();
  await generateProjectReferences();
  console.log('Completed TypeScript Project References fixes');
}

main();
