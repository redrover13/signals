/**
 * Script to enable TypeScript Project References across the monorepo
 *
 * This script finds all tsconfig.lib.json files and updates them to support
 * TypeScript's composite builds, which are essential for Project References.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { globby } from 'globby';

// The properties we want to ensure exist in each tsconfig.lib.json
const ensureProperties = {
  compilerOptions: {
    composite: true,
    declarationMap: true,
  },
};

async function updateTsconfig(filePath) {
  try {
    // Read the current tsconfig.lib.json
    const content = await fs.readFile(filePath, 'utf8');
    const config = JSON.parse(content);

    // Ensure compilerOptions exists
    if (!config.compilerOptions) {
      config.compilerOptions = {};
    }

    // Add or update the required properties
    config.compilerOptions.composite = true;
    config.compilerOptions.declarationMap = true;

    // Write the updated config back to the file
    await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf8');
    console.log(`✅ Updated ${filePath}`);

    return true;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  try {
    // Find all tsconfig.lib.json files
    const libConfigFiles = await globby('**/tsconfig.lib.json', {
      ignore: ['**/node_modules/**', '**/dist/**'],
    });

    console.log(`Found ${libConfigFiles.length} tsconfig.lib.json files to update`);

    // Update each config file
    const results = await Promise.all(libConfigFiles.map(updateTsconfig));

    // Count successful updates
    const successCount = results.filter(Boolean).length;
    console.log(`\n✅ Successfully updated ${successCount} of ${libConfigFiles.length} files`);

    if (successCount !== libConfigFiles.length) {
      console.error(`❌ Failed to update ${libConfigFiles.length - successCount} files`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();

main();
