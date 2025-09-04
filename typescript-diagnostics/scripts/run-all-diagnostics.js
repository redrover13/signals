#!/usr/bin/env node

/**
 * TypeScript Diagnostics Runner
 *
 * This script runs all TypeScript diagnostic tools in sequence.
 *
 * Usage:
 *   node typescript-diagnostics/scripts/run-all-diagnostics.js
 *
 * Output:
 *   - Runs all diagnostic scripts
 *   - Generates a summary report
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const REPORTS_DIR = path.resolve(ROOT_DIR, 'typescript-diagnostics/reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

console.log('🔎 TypeScript Diagnostics Runner');
console.log('================================');

/**
 * Run a diagnostic script
 */
function runScript(scriptName, args = []) {
  const scriptPath = path.join(__dirname, scriptName);

  console.log(`\n🚀 Running ${scriptName}...`);

  try {
    execFileSync('node', [scriptPath, ...args], {
      stdio: 'inherit',
      cwd: ROOT_DIR,
    });
    return true;
  } catch (error) {
    console.error(`Error running ${scriptName}:`, error.message);
    return false;
  }
}

/**
 * Generate final summary report
 */
function generateSummary() {
  console.log('\n📊 Generating summary report...');

  const summary = {
    timestamp: new Date().toISOString(),
    reports: [],
  };

  // Find all report files
  const reportFiles = fs
    .readdirSync(REPORTS_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => path.join(REPORTS_DIR, file));

  // Collect data from each report
  for (const reportFile of reportFiles) {
    try {
      const reportContent = fs.readFileSync(reportFile, 'utf8');
      const report = JSON.parse(reportContent);
      const reportName = path.basename(reportFile, '.json');

      // Extract key information based on report type
      if (reportName === 'typescript-errors') {
        summary.reports.push({
          name: 'TypeScript Errors',
          file: reportName,
          totalErrors: report.totalErrors,
          totalFiles: report.totalFiles,
          topErrors: Object.entries(report.errorCategories)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 3)
            .map(([code, data]) => ({
              code,
              message: data.message,
              count: data.count,
            })),
        });
      } else if (reportName === 'tsconfig-analysis') {
        summary.reports.push({
          name: 'TypeScript Configuration Analysis',
          file: reportName,
          totalConfigs: report.totalConfigs,
          inconsistentSettings: Object.keys(report.inconsistentSettings || {}).length,
        });
      } else if (reportName === 'lodash-migration-analysis') {
        summary.reports.push({
          name: 'Lodash Migration Analysis',
          file: reportName,
          totalFiles: report.totalFiles,
          lodashCommonjs: report.lodashImports?.commonjs?.count || 0,
          lodashEsm: report.lodashImports?.esm?.count || 0,
          lodashMixed: report.lodashImports?.mixed?.count || 0,
        });
      } else if (reportName === 'typescript-fixes') {
        summary.reports.push({
          name: 'TypeScript Fixes',
          file: reportName,
          totalErrors: report.errors?.total || 0,
          fixesCreated: report.fixes?.created?.length || 0,
          fixesApplied: report.fixes?.applied?.length || 0,
        });
      } else if (reportName === 'import-export-analysis') {
        summary.reports.push({
          name: 'Import/Export Analysis',
          file: reportName,
          totalFiles: report.totalFiles,
          esmImports: report.importPatterns?.esm || 0,
          commonjsImports: report.importPatterns?.commonjs || 0,
          mixedImports: report.importPatterns?.mixed || 0,
        });
      } else if (reportName === 'module-system-analysis') {
        summary.reports.push({
          name: 'Module System Analysis',
          file: reportName,
          totalPackages: report.totalPackages,
          inconsistencies: report.inconsistencies?.length || 0,
        });
      }
    } catch (error) {
      console.error(`Error processing ${reportFile}:`, error.message);
    }
  }

  // Generate markdown summary
  const markdownSummary = [
    '# TypeScript Diagnostics Summary',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Overview',
    '',
  ];

  // Add overview tables
  for (const report of summary.reports) {
    markdownSummary.push(`### ${report.name}`);
    markdownSummary.push('');

    // Add table based on report type
    if (report.name === 'TypeScript Errors') {
      markdownSummary.push('| Metric | Value |');
      markdownSummary.push('|--------|-------|');
      markdownSummary.push(`| Total Errors | ${report.totalErrors} |`);
      markdownSummary.push(`| Files with Errors | ${report.totalFiles} |`);
      markdownSummary.push('');

      markdownSummary.push('Top Error Types:');
      markdownSummary.push('');

      for (const error of report.topErrors) {
        markdownSummary.push(`- TS${error.code}: ${error.count} occurrences - ${error.message}`);
      }
    } else if (report.name === 'TypeScript Configuration Analysis') {
      markdownSummary.push('| Metric | Value |');
      markdownSummary.push('|--------|-------|');
      markdownSummary.push(`| Total Configurations | ${report.totalConfigs} |`);
      markdownSummary.push(`| Inconsistent Settings | ${report.inconsistentSettings} |`);
    } else if (report.name === 'Lodash Migration Analysis') {
      markdownSummary.push('| Metric | Value |');
      markdownSummary.push('|--------|-------|');
      markdownSummary.push(`| Total Files | ${report.totalFiles} |`);
      markdownSummary.push(`| CommonJS Lodash Imports | ${report.lodashCommonjs} |`);
      markdownSummary.push(`| ESM Lodash Imports | ${report.lodashEsm} |`);
      markdownSummary.push(`| Mixed Lodash Imports | ${report.lodashMixed} |`);
    } else if (report.name === 'TypeScript Fixes') {
      markdownSummary.push('| Metric | Value |');
      markdownSummary.push('|--------|-------|');
      markdownSummary.push(`| Total Errors | ${report.totalErrors} |`);
      markdownSummary.push(`| Fixes Created | ${report.fixesCreated} |`);
      markdownSummary.push(`| Fixes Applied | ${report.fixesApplied} |`);
    } else if (report.name === 'Import/Export Analysis') {
      markdownSummary.push('| Metric | Value |');
      markdownSummary.push('|--------|-------|');
      markdownSummary.push(`| Total Files | ${report.totalFiles} |`);
      markdownSummary.push(`| ESM Imports | ${report.esmImports} |`);
      markdownSummary.push(`| CommonJS Imports | ${report.commonjsImports} |`);
      markdownSummary.push(`| Mixed Imports | ${report.mixedImports} |`);
    } else if (report.name === 'Module System Analysis') {
      markdownSummary.push('| Metric | Value |');
      markdownSummary.push('|--------|-------|');
      markdownSummary.push(`| Total Packages | ${report.totalPackages} |`);
      markdownSummary.push(`| Module System Inconsistencies | ${report.inconsistencies} |`);
    }

    markdownSummary.push('');
  }

  // Add recommendations section
  markdownSummary.push('## Recommendations');
  markdownSummary.push('');
  markdownSummary.push('Based on the diagnostic results, consider the following actions:');
  markdownSummary.push('');
  markdownSummary.push(
    '1. Review the detailed reports in the `typescript-diagnostics/reports/` directory',
  );
  markdownSummary.push('2. Standardize TypeScript configurations using the generated templates');
  markdownSummary.push('3. Fix common TypeScript errors using the provided fix scripts');
  markdownSummary.push('4. Migrate from CommonJS to ESM consistently across the codebase');
  markdownSummary.push('5. Ensure proper lodash-es imports for better tree-shaking');
  markdownSummary.push('');
  markdownSummary.push('## Next Steps');
  markdownSummary.push('');
  markdownSummary.push(
    '1. Run the fix scripts with the `--apply` flag to automatically apply fixes',
  );
  markdownSummary.push('2. Run the TypeScript compiler again to verify the remaining errors');
  markdownSummary.push(
    '3. Update project documentation to reflect the new TypeScript configuration standards',
  );
  markdownSummary.push('4. Create a PR with all the fixes and configuration updates');

  // Save the summary
  fs.writeFileSync(path.join(REPORTS_DIR, 'diagnostic-summary.md'), markdownSummary.join('\n'));

  // Save JSON summary
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'diagnostic-summary.json'),
    JSON.stringify(summary, null, 2),
  );

  console.log('Generated summary report at typescript-diagnostics/reports/diagnostic-summary.md');
}

// Run all diagnostic scripts
const scripts = [
  { name: 'diagnose.js', args: [] },
  { name: 'analyze-lodash-migration.js', args: [] },
  { name: 'standardize-tsconfig.js', args: [] },
  { name: 'fix-common-errors.js', args: [] },
];

let successCount = 0;

for (const script of scripts) {
  const success = runScript(script.name, script.args);
  if (success) successCount++;
}

// Generate summary if at least one script succeeded
if (successCount > 0) {
  generateSummary();
}

console.log('\n✅ TypeScript diagnostics completed!');
console.log(`Successfully ran ${successCount} out of ${scripts.length} diagnostic scripts`);
console.log('Check the reports in typescript-diagnostics/reports/ for detailed information.');
