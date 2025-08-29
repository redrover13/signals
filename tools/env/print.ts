/**
 * @fileoverview Environment variables printing script
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Prints environment configuration for debugging (without exposing sensitive values).
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

function maskValue(value: string): string {
  if (value.length <= 4) {
    return '*'.repeat(value.length);
  }
  return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
}

async function printEnvironment() {
  console.log('🔧 Environment Configuration Summary\n');

  const targets = ['api', 'agents', 'web', 'agent-frontend'] as const;

  for (const target of targets) {
    try {
      console.log(`📋 ${target.toUpperCase()} Configuration:`);
      const config = getConfig(target);
      
      Object.entries(config).forEach(([key, value]) => {
        const maskedValue = typeof value === 'string' ? maskValue(value) : String(value);
        console.log(`   ${key}: ${maskedValue}`);
      });
    } catch (error) {
      console.error(`❌ ${target}: Configuration error`);
      if (error instanceof Error) {
        console.error(`   Error: ${error.message}`);
      }
    }
    console.log();
  }
}

printEnvironment().catch((error) => {
  console.error('💥 Error printing environment configuration:', error);
  process.exit(1);
});