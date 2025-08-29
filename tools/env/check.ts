/**
 * @fileoverview Environment validation check script
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Validates environment configuration for all targets.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Use relative import for now since workspace discovery isn't working
import { getConfig } from '../../libs/env/src/index.js';

async function checkEnvironment() {
  console.log('🔍 Checking environment configuration...\n');

  const targets = ['api', 'agents', 'web', 'agent-frontend'] as const;
  let hasErrors = false;

  for (const target of targets) {
    try {
      console.log(`📋 Validating ${target} configuration...`);
      const config = getConfig(target);
      
      // Log the number of validated variables without exposing values
      const keys = Object.keys(config);
      console.log(`✅ ${target}: ${keys.length} environment variables validated`);
    } catch (error) {
      hasErrors = true;
      console.error(`❌ ${target}: Validation failed`);
      if (error instanceof Error) {
        console.error(`   Error: ${error.message}`);
      }
    }
    console.log();
  }

  if (hasErrors) {
    console.error('❌ Environment validation failed');
    console.error('💡 Check your .env.local file against .env.example');
    process.exit(1);
  } else {
    console.log('✅ All environment configurations validated successfully');
    console.log('🎉 Ready to build and deploy!');
  }
}

checkEnvironment().catch((error) => {
  console.error('💥 Critical error during environment validation:', error);
  process.exit(1);
});