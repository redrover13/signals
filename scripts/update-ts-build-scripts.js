#!/usr/bin/env node

/**
 * This script updates the package.json to add TypeScript Project References build scripts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');

// Read the current package.json
function readPackageJson() {
  try {
    const content = fs.readFileSync(PACKAGE_JSON_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading package.json:', error.message);
    process.exit(1);
  }
}

// Write updated package.json
function writePackageJson(packageJson) {
  try {
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2), 'utf8');
    console.log('Successfully updated package.json');
  } catch (error) {
    console.error('Error writing package.json:', error.message);
    process.exit(1);
  }
}

// Update package.json with TypeScript Project References scripts
function updatePackageJson() {
  const packageJson = readPackageJson();
  
  // Add/update TypeScript Project References scripts
  packageJson.scripts = packageJson.scripts || {};
  
  // Define the scripts to add or update
  const scriptsToAdd = {
    "ts:build": "tsc -b tsconfig.references.json",
    "ts:build:watch": "tsc -b tsconfig.references.json --watch",
    "ts:clean": "tsc -b tsconfig.references.json --clean",
    "ts:refs:enable": "node scripts/enable-ts-project-references.js",
    "ts:refs:fix": "node scripts/fix-ts-project-references.js",
    "ts:build:project": "tsc -b",
    "ts:build:libs": "tsc -b libs/*/tsconfig.json",
    "ts:build:apps": "tsc -b apps/*/tsconfig.json",
    "ts:refs:generate": "node scripts/generate-ts-references.js"
  };
  
  // Add or update the scripts
  let changedCount = 0;
  for (const [name, command] of Object.entries(scriptsToAdd)) {
    if (packageJson.scripts[name] !== command) {
      packageJson.scripts[name] = command;
      changedCount++;
    }
  }
  
  if (changedCount > 0) {
    console.log(`Added/updated ${changedCount} TypeScript build scripts`);
    writePackageJson(packageJson);
  } else {
    console.log('No changes needed to package.json scripts');
  }
}

// Main function
function main() {
  console.log('Updating package.json with TypeScript Project References scripts...');
  updatePackageJson();
}

main();
