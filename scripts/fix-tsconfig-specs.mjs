#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { globby } from 'globby';

console.log('Fixing tsconfig.spec.json files...');

// Find all tsconfig.spec.json files
const specConfigFiles = await globby('**/tsconfig.spec.json', {
  ignore: ['node_modules/**', 'dist/**'],
});

console.log(`Found ${specConfigFiles.length} tsconfig.spec.json files to fix`);

let fixedCount = 0;

for (const configPath of specConfigFiles) {
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(content);

    // Ensure include array includes both strict and flexible patterns
    const currentIncludes = config.include || [];
    const needsUpdate =
      !currentIncludes.includes('**/*.spec.ts') || !currentIncludes.includes('**/*.test.ts');

    if (needsUpdate) {
      // Add missing include patterns
      if (!currentIncludes.includes('**/*.spec.ts')) {
        currentIncludes.push('**/*.spec.ts');
      }
      if (!currentIncludes.includes('**/*.test.ts')) {
        currentIncludes.push('**/*.test.ts');
      }

      config.include = currentIncludes;

      // Write back the updated config
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(`✅ Fixed ${configPath}`);
      fixedCount++;
    } else {
      console.log(`✓ ${configPath} already correct`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${configPath}:`, error.message);
  }
}

console.log(`\n✅ Fixed ${fixedCount} tsconfig.spec.json files`);
