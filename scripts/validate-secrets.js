#!/usr/bin/env node
/**
 * @fileoverview validate-secrets.js
 *
 * Script to validate that all required secrets are properly configured
 * in Google Cloud Secret Manager for the Dulce de Saigon platform
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// @ts-check

import { execSync } from 'child_process';

const REQUIRED_SECRETS = [
  'github-token',
  'codacy-token',
  'sentry-token',
  'tavily-api-key',
  'qdrant-api-key',
  'qdrant-url',
  'gcp-project-id',
  'jwt-secret',
  'dulce-api-key'
];

const OPTIONAL_SECRETS = [
  'nx-cloud-token',
  'dictl-dop-token',
  'gitguardian-token',
  'smither-token',
  'google-api-key',
  'google-cse-id',
  'brave-api-key',
  'postgres-connection'
];

function getGcpProjectId() {
  try {
    return execSync('gcloud config get-value project', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error('❌ Unable to get GCP project ID from gcloud config');
    console.log('Please run: gcloud config set project YOUR_PROJECT_ID');
    process.exit(1);
  }
}

function checkSecretExists(secretName, projectId) {
  try {
    execSync(`gcloud secrets describe ${secretName} --project=${projectId}`, {
      stdio: 'pipe'
    });
    return true;
  } catch (error) {
    return false;
  }
}

function validateSecrets() {
  const projectId = getGcpProjectId();
  console.log(`🔍 Validating secrets for GCP project: ${projectId}\n`);

  let allValid = true;
  let missingRequired = [];
  let missingOptional = [];

  console.log('📋 Checking REQUIRED secrets:');
  console.log('=' .repeat(50));

  for (const secret of REQUIRED_SECRETS) {
    if (checkSecretExists(secret, projectId)) {
      console.log(`✅ ${secret}`);
    } else {
      console.log(`❌ ${secret} - MISSING`);
      missingRequired.push(secret);
      allValid = false;
    }
  }

  console.log('\n📋 Checking OPTIONAL secrets:');
  console.log('=' .repeat(50));

  for (const secret of OPTIONAL_SECRETS) {
    if (checkSecretExists(secret, projectId)) {
      console.log(`✅ ${secret}`);
    } else {
      console.log(`⚠️  ${secret} - Not configured (optional)`);
      missingOptional.push(secret);
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('📊 VALIDATION SUMMARY');
  console.log('=' .repeat(50));

  if (allValid) {
    console.log('🎉 All required secrets are properly configured!');
    console.log('\n💡 Next steps:');
    console.log('1. Ensure your service account has "Secret Manager Secret Accessor" role');
    console.log('2. Test your application with the secrets');
    console.log('3. Set up secret rotation policies for production');
  } else {
    console.log('❌ Some required secrets are missing:');
    missingRequired.forEach(secret => console.log(`   - ${secret}`));

    console.log('\n🔧 To fix this:');
    console.log('1. Run the setup script: ./scripts/setup-secrets.sh');
    console.log('2. Or create secrets manually with gcloud:');
    missingRequired.forEach(secret => {
      console.log(`   gcloud secrets create ${secret} --project=${projectId}`);
    });
  }

  if (missingOptional.length > 0) {
    console.log('\n⚠️  Optional secrets not configured:');
    missingOptional.forEach(secret => console.log(`   - ${secret}`));
    console.log('\n💡 You can add these later as needed.');
  }

  console.log('\n🔗 Useful commands:');
  console.log(`   List all secrets: gcloud secrets list --project=${projectId}`);
  console.log(`   View secret value: gcloud secrets versions access latest --secret=github-token --project=${projectId}`);

  return allValid;
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateSecrets();
}

export { validateSecrets, REQUIRED_SECRETS, OPTIONAL_SECRETS };
