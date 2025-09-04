#!/usr/bin/env node

/**
 * Codacy Compliance Verification
 *
 * This script runs Codacy analysis on TypeScript files that have been modified
 * by the TypeScript diagnostic tools to ensure they comply with Codacy rules.
 *
 * Usage:
 *   node typescript-diagnostics/scripts/verify-codacy-compliance.js [--files=file1,file2,...]
 *
 * Options:
 *   --files   Comma-separated list of files to verify (optional)
 */

import fs from 'fs';
import path from 'path';
import { execSync, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const REPORTS_DIR = path.resolve(ROOT_DIR, 'typescript-diagnostics/reports');

// Parse command line arguments
const args = process.argv.slice(2);
let filesToVerify = [];

for (const arg of args) {
  if (arg.startsWith('--files=')) {
    filesToVerify = arg.substring('--files='.length).split(',');
  }
}

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

console.log('🔍 Codacy Compliance Verification');
console.log('=================================');

/**
 * Run Codacy analysis on specified files
 */
async function verifyCodacyCompliance() {
  console.log('\n📊 Running Codacy analysis...');

  // If no files specified, use recently modified files
  if (filesToVerify.length === 0) {
    console.log('No files specified, analyzing recently modified TypeScript files...');

    try {
      // Get files modified in the last day
      const gitOutput = execSync(
        'git diff --name-only --diff-filter=M HEAD~5..HEAD | grep -E "\\.ts$"',
        { encoding: 'utf8', cwd: ROOT_DIR },
      );

      filesToVerify = gitOutput.trim().split('\n').filter(Boolean);

      if (filesToVerify.length === 0) {
        console.log('No recently modified TypeScript files found.');
        return;
      }

      console.log(`Found ${filesToVerify.length} recently modified TypeScript files.`);
    } catch (error) {
      console.error('Error getting modified files:', error.message);
      return;
    }
  }

  // Results object to store Codacy findings
  const results = {
    timestamp: new Date().toISOString(),
    totalFiles: filesToVerify.length,
    filesWithIssues: 0,
    totalIssues: 0,
    issuesByFile: {},
    summary: {
      error: 0,
      warning: 0,
      info: 0,
    },
  };

  // Process each file
  for (const filePath of filesToVerify) {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(ROOT_DIR, filePath);
    const relativeFilePath = path.relative(ROOT_DIR, fullPath);

    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${relativeFilePath}`);
      continue;
    }

    console.log(`Analyzing ${relativeFilePath}...`);

    try {
      // Run Codacy CLI analyze
      const codacyOutput = execFileSync(
        'codacy-analysis-cli',
        ['analyze', '--directory', ROOT_DIR, '--files', relativeFilePath, '--format', 'json'],
        { encoding: 'utf8', cwd: ROOT_DIR, stdio: ['pipe', 'pipe', 'pipe'] },
      );

      // Parse the JSON output
      try {
        const issues = JSON.parse(codacyOutput);

        if (issues.length > 0) {
          results.filesWithIssues++;
          results.totalIssues += issues.length;
          results.issuesByFile[relativeFilePath] = [];

          for (const issue of issues) {
            results.issuesByFile[relativeFilePath].push({
              level: issue.level,
              message: issue.message,
              line: issue.location?.line,
              pattern: issue.patternId,
            });

            // Update summary
            if (issue.level in results.summary) {
              results.summary[issue.level]++;
            }
          }
        }
      } catch (parseError) {
        console.error(`Error parsing Codacy output for ${relativeFilePath}:`, parseError.message);
      }
    } catch (execError) {
      console.error(`Error running Codacy analysis on ${relativeFilePath}:`, execError.message);
    }
  }

  // Generate report
  console.log('\n📝 Generating Codacy compliance report...');

  // Save JSON report
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'codacy-compliance.json'),
    JSON.stringify(results, null, 2),
  );

  // Generate human-readable report
  const markdownReport = [
    '# Codacy Compliance Report',
    '',
    `Generated: ${new Date(results.timestamp).toLocaleString()}`,
    '',
    '## Summary',
    '',
    `- Total Files Analyzed: ${results.totalFiles}`,
    `- Files with Issues: ${results.filesWithIssues}`,
    `- Total Issues: ${results.totalIssues}`,
    '',
    '### Issue Levels',
    '',
    `- Error: ${results.summary.error}`,
    `- Warning: ${results.summary.warning}`,
    `- Info: ${results.summary.info}`,
    '',
    '## Issues by File',
    '',
  ];

  // Add details for each file with issues
  for (const [file, issues] of Object.entries(results.issuesByFile)) {
    markdownReport.push(`### ${file}`);
    markdownReport.push('');
    markdownReport.push('| Level | Line | Message | Pattern |');
    markdownReport.push('|-------|------|---------|---------|');

    for (const issue of issues) {
      markdownReport.push(
        `| ${issue.level} | ${issue.line || 'N/A'} | ${issue.message} | ${issue.pattern} |`,
      );
    }

    markdownReport.push('');
  }

  // Add recommendations
  markdownReport.push('## Recommendations');
  markdownReport.push('');

  if (results.totalIssues > 0) {
    markdownReport.push('Based on the Codacy analysis, consider the following actions:');
    markdownReport.push('');
    markdownReport.push('1. Review and fix error-level issues first');
    markdownReport.push('2. Address warning-level issues in frequently modified files');
    markdownReport.push(
      '3. Consider configuring Codacy to ignore specific patterns if they conflict with project standards',
    );
    markdownReport.push(
      '4. Update TypeScript diagnostic tools to prevent introducing new Codacy issues',
    );
  } else {
    markdownReport.push('✅ No Codacy issues found in the analyzed files. Great job!');
  }

  // Save markdown report
  fs.writeFileSync(path.join(REPORTS_DIR, 'codacy-compliance.md'), markdownReport.join('\n'));

  // Print summary
  console.log('\n📊 Codacy Compliance Summary:');
  console.log(`- Total Files Analyzed: ${results.totalFiles}`);
  console.log(`- Files with Issues: ${results.filesWithIssues}`);
  console.log(`- Total Issues: ${results.totalIssues}`);
  console.log(`  - Error: ${results.summary.error}`);
  console.log(`  - Warning: ${results.summary.warning}`);
  console.log(`  - Info: ${results.summary.info}`);

  if (results.totalIssues > 0) {
    console.log('\nSee typescript-diagnostics/reports/codacy-compliance.md for details.');
  } else {
    console.log('\n✅ No Codacy issues found in the analyzed files.');
  }
}

// Run verification
verifyCodacyCompliance().catch((error) => {
  console.error('Error:', error);
});
