#!/usr/bin/env node

/**
 * This script generates a tsconfig.references.json file in the root of the project.
 * This file contains references to all projects in the monorepo that have a tsconfig.json
 * This makes it possible to build all projects with a single tsc -b command.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TSCONFIG_REFERENCES_PATH = path.join(ROOT_DIR, 'tsconfig.references.json');

// Find all tsconfig.json files in the project
function findTsConfigFiles() {
  // Only include projects in libs and apps directories
  const patterns = [
    'libs/*/tsconfig.json',
    'apps/*/tsconfig.json',
    'libs/*/*/tsconfig.json',
    'apps/*/*/tsconfig.json'
  ];
  
  let allPaths = [];
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, {
      cwd: ROOT_DIR,
      ignore: ['**/node_modules/**', '**/dist/**', '**/tmp/**']
    });
    allPaths = allPaths.concat(files);
  });
  
  return allPaths;
}

// Generate the tsconfig.references.json file
function generateReferencesConfig() {
  const tsConfigPaths = findTsConfigFiles();
  console.log(`Found ${tsConfigPaths.length} tsconfig.json files`);
  
  // Create the references array with relative paths
  const references = tsConfigPaths.map(configPath => {
    return { path: `./${configPath.replace('/tsconfig.json', '')}` };
  });
  
  // Create the tsconfig.references.json content
  const referencesConfig = {
    extends: "./tsconfig.base.json",
    files: [],
    references: references
  };
  
  // Write the file
  fs.writeFileSync(
    TSCONFIG_REFERENCES_PATH,
    JSON.stringify(referencesConfig, null, 2),
    'utf8'
  );
  
  console.log(`Generated tsconfig.references.json with ${references.length} references`);
}

// Main function
function main() {
  console.log('Generating tsconfig.references.json...');
  generateReferencesConfig();
}

main();

main();
