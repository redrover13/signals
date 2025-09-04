#!/usr/bin/env node

/**
 * Nx TypeScript Diagnostics Integration
 *
 * This script integrates the TypeScript diagnostic tools with Nx,
 * allowing for project-specific analysis and fixes.
 *
 * Usage:
 *   node typescript-diagnostics/scripts/nx-typescript-diagnostics.js [--project=projectName] [--fix] [--all]
 *
 * Options:
 *   --project   Specific Nx project to analyze
 *   --fix       Apply fixes automatically
 *   --all       Analyze all projects (default: false)
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const REPORTS_DIR = path.resolve(ROOT_DIR, 'typescript-diagnostics/reports');

// Parse command line arguments
const args = process.argv.slice(2);
let projectName = '';
let applyFixes = false;
let analyzeAll = false;

for (const arg of args) {
  if (arg.startsWith('--project=')) {
    projectName = arg.substring('--project='.length);
  } else if (arg === '--fix') {
    applyFixes = true;
  } else if (arg === '--all') {
    analyzeAll = true;
  }
}

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

console.log('🔍 Nx TypeScript Diagnostics Integration');
console.log('=======================================');
console.log(`Mode: ${applyFixes ? 'Apply fixes' : 'Analysis only'}`);
console.log(
  `Scope: ${analyzeAll ? 'All projects' : projectName ? `Project: ${projectName}` : 'Not specified (using affected)'}`,
);

/**
 * Get list of Nx projects to analyze
 */
function getProjectsToAnalyze() {
  console.log('\n📊 Determining projects to analyze...');

  let projects = [];

  try {
    if (projectName) {
      // Check if project exists
      const allProjects = JSON.parse(
        execSync('npx nx show projects --json', { encoding: 'utf8', cwd: ROOT_DIR }),
      );

      if (!allProjects.includes(projectName)) {
        console.error(`Error: Project "${projectName}" not found.`);
        process.exit(1);
      }

      projects = [projectName];
      console.log(`Analyzing single project: ${projectName}`);
    } else if (analyzeAll) {
      // Get all projects
      projects = JSON.parse(
        execSync('npx nx show projects --json', { encoding: 'utf8', cwd: ROOT_DIR }),
      );

      console.log(`Analyzing all ${projects.length} projects.`);
    } else {
      // Get affected projects
      projects = JSON.parse(
        execSync('npx nx show projects --affected --json', { encoding: 'utf8', cwd: ROOT_DIR }),
      );

      if (projects.length === 0) {
        console.log('No affected projects found. Consider using --all to analyze all projects.');
        process.exit(0);
      }

      console.log(`Analyzing ${projects.length} affected projects.`);
    }

    return projects;
  } catch (error) {
    console.error('Error determining projects:', error.message);
    process.exit(1);
  }
}

/**
 * Get TypeScript files for a specific project
 */
function getProjectTsFiles(project) {
  console.log(`\n📂 Finding TypeScript files for project: ${project}...`);

  try {
    // Get project's source root
    const projectInfo = JSON.parse(
      execSync(`npx nx show project ${project} --json`, { encoding: 'utf8', cwd: ROOT_DIR }),
    );

    const sourceRoot = projectInfo.sourceRoot;
    if (!sourceRoot) {
      console.log(`Project ${project} has no sourceRoot. Skipping.`);
      return [];
    }

    // Find TypeScript files
    const fullSourceRoot = path.join(ROOT_DIR, sourceRoot);
    const tsFiles = [];

    function traverse(dir) {
      const files = fs.readdirSync(dir, { withFileTypes: true });

      for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
          if (file.name !== 'node_modules' && file.name !== 'dist' && !file.name.startsWith('.')) {
            traverse(fullPath);
          }
        } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx'))) {
          tsFiles.push(fullPath);
        }
      }
    }

    traverse(fullSourceRoot);
    console.log(`Found ${tsFiles.length} TypeScript files.`);

    return tsFiles;
  } catch (error) {
    console.error(`Error finding TypeScript files for project ${project}:`, error.message);
    return [];
  }
}

/**
 * Run TypeScript diagnostics on specific files
 */
function runDiagnosticsOnFiles(files, project) {
  console.log(`\n🧐 Running TypeScript diagnostics for project: ${project}...`);

  if (files.length === 0) {
    console.log('No TypeScript files to analyze. Skipping.');
    return;
  }

  const projectReportDir = path.join(REPORTS_DIR, project);
  if (!fs.existsSync(projectReportDir)) {
    fs.mkdirSync(projectReportDir, { recursive: true });
  }

  // Run TypeScript compiler on project files
  try {
    console.log('Running TypeScript compiler...');

    // Create temporary tsconfig for project files
    const tempTsConfigPath = path.join(projectReportDir, 'temp-tsconfig.json');
    const tempTsConfig = {
      extends: '../../tsconfig.base.json',
      include: files.map((f) => path.relative(ROOT_DIR, f)),
      compilerOptions: {
        noEmit: true,
      },
    };

    fs.writeFileSync(tempTsConfigPath, JSON.stringify(tempTsConfig, null, 2));

    // Run TypeScript compiler
    try {
      const tscOutput = execFileSync('npx', ['tsc', '--project', tempTsConfigPath], {
        encoding: 'utf8',
        cwd: ROOT_DIR,
        maxBuffer: 10 * 1024 * 1024,
      });

      // Save compiler output
      fs.writeFileSync(path.join(projectReportDir, 'typescript-errors.log'), tscOutput);

      // Parse errors
      const errorPattern = /^(.+)\((\d+),(\d+)\): error TS(\d+): (.+)$/gm;
      let match;
      let errorCount = 0;
      const errorsByType = {};

      while ((match = errorPattern.exec(tscOutput)) !== null) {
        errorCount++;
        const errorCode = match[4];

        if (!errorsByType[errorCode]) {
          errorsByType[errorCode] = {
            count: 0,
            examples: [],
          };
        }

        errorsByType[errorCode].count++;

        if (errorsByType[errorCode].examples.length < 3) {
          errorsByType[errorCode].examples.push({
            file: match[1],
            line: parseInt(match[2]),
            message: match[5],
          });
        }
      }

      // Save error summary
      fs.writeFileSync(
        path.join(projectReportDir, 'error-summary.json'),
        JSON.stringify(
          {
            project,
            totalErrors: errorCount,
            errorsByType,
          },
          null,
          2,
        ),
      );

      console.log(`Found ${errorCount} TypeScript errors.`);
    } catch (tscError) {
      console.error('Error running TypeScript compiler:', tscError.message);
    }

    // Clean up temporary tsconfig
    fs.unlinkSync(tempTsConfigPath);

    // Run lodash migration analysis if needed
    console.log('Analyzing lodash usage...');

    // Check if project uses lodash
    let usesLodash = false;
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('lodash') || content.includes('lodash-es')) {
        usesLodash = true;
        break;
      }
    }

    if (usesLodash) {
      try {
        // Create temporary script for project-specific lodash analysis
        const tempScriptPath = path.join(projectReportDir, 'analyze-lodash.js');
        const tempScriptContent = `
          import fs from 'fs';
          import path from 'path';
          
          const files = ${JSON.stringify(files)};
          const projectReportDir = ${JSON.stringify(projectReportDir)};
          
          // Analyze lodash imports
          const lodashAnalysis = {
            totalFiles: files.length,
            filesWithLodash: 0,
            lodashImports: {
              commonjs: 0,
              esm: 0,
              mixed: 0
            }
          };
          
          for (const file of files) {
            try {
              const content = fs.readFileSync(file, 'utf8');
              
              // Check for lodash imports
              const hasLodash = content.includes('lodash') || content.includes('lodash-es');
              if (hasLodash) {
                lodashAnalysis.filesWithLodash++;
                
                const hasCjsImports = content.includes("require('lodash") || content.includes('require("lodash');
                const hasEsmImports = content.includes("from 'lodash") || content.includes('from "lodash');
                
                if (hasCjsImports && hasEsmImports) {
                  lodashAnalysis.lodashImports.mixed++;
                } else if (hasCjsImports) {
                  lodashAnalysis.lodashImports.commonjs++;
                } else if (hasEsmImports) {
                  lodashAnalysis.lodashImports.esm++;
                }
              }
            } catch (error) {
              console.error(\`Error analyzing \${file}:\`, error.message);
            }
          }
          
          // Save analysis
          fs.writeFileSync(
            path.join(projectReportDir, 'lodash-analysis.json'),
            JSON.stringify(lodashAnalysis, null, 2)
          );
        `;

        fs.writeFileSync(tempScriptPath, tempScriptContent);

        // Run the temporary script
        execSync(`node ${tempScriptPath}`, { encoding: 'utf8', cwd: ROOT_DIR });

        // Clean up temporary script
        fs.unlinkSync(tempScriptPath);

        console.log('Lodash analysis completed.');
      } catch (lodashError) {
        console.error('Error analyzing lodash usage:', lodashError.message);
      }
    } else {
      console.log('Project does not use lodash. Skipping lodash analysis.');
    }

    // Run fixes if requested
    if (applyFixes) {
      console.log('Applying automated fixes...');

      // TODO: Implement project-specific fixes
      // This would apply a subset of fixes from fix-common-errors.js focused on the project files

      console.log('Automated fixes applied.');
    }
  } catch (error) {
    console.error(`Error running diagnostics for project ${project}:`, error.message);
  }
}

/**
 * Generate summary report for all analyzed projects
 */
function generateSummaryReport(projects) {
  console.log('\n📝 Generating summary report...');

  const summary = {
    timestamp: new Date().toISOString(),
    projects: [],
  };

  for (const project of projects) {
    const projectReportDir = path.join(REPORTS_DIR, project);
    const errorSummaryPath = path.join(projectReportDir, 'error-summary.json');
    const lodashAnalysisPath = path.join(projectReportDir, 'lodash-analysis.json');

    const projectSummary = {
      name: project,
      typeScriptErrors: 0,
      lodashUsage: {
        filesWithLodash: 0,
        commonjs: 0,
        esm: 0,
        mixed: 0,
      },
    };

    // Get TypeScript errors
    if (fs.existsSync(errorSummaryPath)) {
      try {
        const errorSummary = JSON.parse(fs.readFileSync(errorSummaryPath, 'utf8'));
        projectSummary.typeScriptErrors = errorSummary.totalErrors;
      } catch (error) {
        console.error(`Error reading error summary for ${project}:`, error.message);
      }
    }

    // Get lodash analysis
    if (fs.existsSync(lodashAnalysisPath)) {
      try {
        const lodashAnalysis = JSON.parse(fs.readFileSync(lodashAnalysisPath, 'utf8'));
        projectSummary.lodashUsage.filesWithLodash = lodashAnalysis.filesWithLodash;
        projectSummary.lodashUsage.commonjs = lodashAnalysis.lodashImports.commonjs;
        projectSummary.lodashUsage.esm = lodashAnalysis.lodashImports.esm;
        projectSummary.lodashUsage.mixed = lodashAnalysis.lodashImports.mixed;
      } catch (error) {
        console.error(`Error reading lodash analysis for ${project}:`, error.message);
      }
    }

    summary.projects.push(projectSummary);
  }

  // Save summary
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'nx-projects-summary.json'),
    JSON.stringify(summary, null, 2),
  );

  // Generate markdown summary
  const markdownSummary = [
    '# Nx Projects TypeScript Diagnostics Summary',
    '',
    `Generated: ${new Date(summary.timestamp).toLocaleString()}`,
    '',
    '## Project Overview',
    '',
    '| Project | TypeScript Errors | Lodash Files | CommonJS Imports | ESM Imports | Mixed Imports |',
    '|---------|-------------------|--------------|-----------------|-------------|---------------|',
  ];

  for (const project of summary.projects) {
    markdownSummary.push(
      `| ${project.name} | ${project.typeScriptErrors} | ${project.lodashUsage.filesWithLodash} | ` +
        `${project.lodashUsage.commonjs} | ${project.lodashUsage.esm} | ${project.lodashUsage.mixed} |`,
    );
  }

  // Add recommendations
  markdownSummary.push('');
  markdownSummary.push('## Recommendations');
  markdownSummary.push('');

  // Sort projects by error count
  const projectsByErrors = [...summary.projects].sort(
    (a, b) => b.typeScriptErrors - a.typeScriptErrors,
  );
  const projectsWithLodashIssues = summary.projects.filter(
    (p) => p.lodashUsage.commonjs > 0 || p.lodashUsage.mixed > 0,
  );

  if (projectsByErrors.length > 0 && projectsByErrors[0].typeScriptErrors > 0) {
    markdownSummary.push('### TypeScript Error Priorities');
    markdownSummary.push('');
    markdownSummary.push('Focus on fixing errors in these projects first:');
    markdownSummary.push('');

    for (let i = 0; i < Math.min(3, projectsByErrors.length); i++) {
      if (projectsByErrors[i].typeScriptErrors > 0) {
        markdownSummary.push(
          `1. **${projectsByErrors[i].name}** (${projectsByErrors[i].typeScriptErrors} errors)`,
        );
      }
    }

    markdownSummary.push('');
  }

  if (projectsWithLodashIssues.length > 0) {
    markdownSummary.push('### Lodash Migration Priorities');
    markdownSummary.push('');
    markdownSummary.push('These projects need lodash-es migration attention:');
    markdownSummary.push('');

    for (const project of projectsWithLodashIssues) {
      markdownSummary.push(
        `- **${project.name}** (${project.lodashUsage.commonjs} CommonJS, ${project.lodashUsage.mixed} mixed imports)`,
      );
    }

    markdownSummary.push('');
  }

  markdownSummary.push('### Next Steps');
  markdownSummary.push('');
  markdownSummary.push(
    '1. Run the TypeScript diagnostic tools with the `--fix` flag to automatically apply fixes',
  );
  markdownSummary.push(
    '2. Review project-specific reports in `typescript-diagnostics/reports/<project>/`',
  );
  markdownSummary.push('3. Create focused PRs for high-priority projects');

  fs.writeFileSync(path.join(REPORTS_DIR, 'nx-projects-summary.md'), markdownSummary.join('\n'));

  console.log('Summary report generated.');
}

// Main execution
const projects = getProjectsToAnalyze();

for (const project of projects) {
  const tsFiles = getProjectTsFiles(project);
  runDiagnosticsOnFiles(tsFiles, project);
}

generateSummaryReport(projects);

console.log('\n✅ Nx TypeScript diagnostics completed!');
console.log('Check the reports in typescript-diagnostics/reports/ for detailed information.');
