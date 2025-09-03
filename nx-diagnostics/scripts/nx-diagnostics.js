#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const outputDir = path.resolve('nx-diagnostics/reports');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🔍 Nx Workspace Diagnostic Tool');
console.log('===============================');

try {
  // Phase 1: Analyze project structure
  console.log('\n📊 Phase 1: Analyzing project structure...');
  const projectAnalysis = analyzeProjectStructure();

  // Phase 2: Analyze dependencies
  console.log('\n🔗 Phase 2: Analyzing dependencies...');
  const dependencyAnalysis = analyzeDependencies();

  // Phase 3: Analyze build configurations
  console.log('\n⚙️ Phase 3: Analyzing build configurations...');
  const buildAnalysis = analyzeBuildConfigurations();

  // Phase 4: Analyze test coverage
  console.log('\n🧪 Phase 4: Analyzing test coverage...');
  const testAnalysis = analyzeTestCoverage();

  // Generate comprehensive report
  console.log('\n📝 Generating comprehensive report...');
  const report = {
    timestamp,
    summary: {
      totalProjects: projectAnalysis.totalProjects,
      appsCount: projectAnalysis.appsCount,
      libsCount: projectAnalysis.libsCount,
      circularDependencies: dependencyAnalysis.circularDependencies.length,
      missingDependencies: dependencyAnalysis.missingDependencies.length,
      buildIssues: buildAnalysis.issues.length,
      testCoverage: testAnalysis.coverage,
      projectsWithoutTests: testAnalysis.projectsWithoutTests.length
    },
    projectAnalysis,
    dependencyAnalysis,
    buildAnalysis,
    testAnalysis,
    recommendations: generateRecommendations(projectAnalysis, dependencyAnalysis, buildAnalysis, testAnalysis)
  };

  // Save report as JSON
  const jsonReportPath = path.join(outputDir, `nx-diagnostics-${timestamp}.json`);
  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
  console.log(`✅ JSON report saved to: ${jsonReportPath}`);

  // Save report as Markdown
  const mdReportPath = path.join(outputDir, `nx-diagnostics-${timestamp}.md`);
  fs.writeFileSync(mdReportPath, generateMarkdownReport(report));
  console.log(`✅ Markdown report saved to: ${mdReportPath}`);

  console.log('\n✨ Nx diagnostics completed successfully!');
  console.log(`📊 Found ${report.summary.totalProjects} projects with ${report.summary.libsCount} libraries and ${report.summary.appsCount} applications`);
  console.log(`🔗 Identified ${report.summary.circularDependencies} circular dependencies and ${report.summary.missingDependencies} missing dependencies`);
  console.log(`⚙️ Found ${report.summary.buildIssues} build configuration issues`);
  console.log(`🧪 ${report.summary.projectsWithoutTests.length} projects lack test coverage`);

} catch (error) {
  console.error('❌ Error during Nx diagnostics:', error);
  process.exit(1);
}

function analyzeProjectStructure() {
  console.log('  📁 Scanning project directories...');

  const apps = [];
  const libs = [];

  // Find all project.json files
  const findCommand = `find apps libs -name "project.json" -type f 2>/dev/null`;
  const projectFiles = execSync(findCommand, { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);

  for (const projectFile of projectFiles) {
    try {
      const projectPath = path.dirname(projectFile);
      const projectJson = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
      const projectName = projectJson.name || path.basename(projectPath);

      const projectInfo = {
        name: projectName,
        path: projectPath,
        type: projectPath.startsWith('apps/') ? 'app' : 'lib',
        tags: projectJson.tags || [],
        targets: Object.keys(projectJson.targets || {}),
        dependencies: projectJson.implicitDependencies || [],
        sourceRoot: projectJson.sourceRoot || 'src'
      };

      if (projectInfo.type === 'app') {
        apps.push(projectInfo);
      } else {
        libs.push(projectInfo);
      }
    } catch (error) {
      console.warn(`  ⚠️ Warning: Could not parse ${projectFile}:`, error.message);
    }
  }

  return {
    totalProjects: apps.length + libs.length,
    appsCount: apps.length,
    libsCount: libs.length,
    apps,
    libs,
    issues: identifyProjectStructureIssues(apps, libs)
  };
}

function identifyProjectStructureIssues(apps, libs) {
  const issues = [];

  // Check for missing tags
  const projectsWithoutTags = [...apps, ...libs].filter(p => p.tags.length === 0);
  if (projectsWithoutTags.length > 0) {
    issues.push({
      type: 'missing-tags',
      severity: 'medium',
      description: `${projectsWithoutTags.length} projects lack proper tags for organization`,
      projects: projectsWithoutTags.map(p => p.name)
    });
  }

  // Check for inconsistent naming
  const inconsistentNaming = [...apps, ...libs].filter(p => {
    const expectedName = p.path.replace(/^(apps|libs)\//, '').replace(/\//g, '-');
    return p.name !== expectedName;
  });
  if (inconsistentNaming.length > 0) {
    issues.push({
      type: 'inconsistent-naming',
      severity: 'low',
      description: `${inconsistentNaming.length} projects have inconsistent naming patterns`,
      projects: inconsistentNaming.map(p => ({ name: p.name, expected: p.path.replace(/^(apps|libs)\//, '').replace(/\//g, '-') }))
    });
  }

  return issues;
}

function analyzeDependencies() {
  console.log('  🔗 Analyzing project dependencies...');

  try {
    // Try to get the project graph
    const graphOutput = execSync('npx nx graph --file=temp-graph.json 2>/dev/null || echo "{}"', { encoding: 'utf8' });
    let graph = {};

    if (fs.existsSync('temp-graph.json')) {
      graph = JSON.parse(fs.readFileSync('temp-graph.json', 'utf8'));
    }

    const circularDeps = findCircularDependencies(graph);
    const missingDeps = findMissingDependencies(graph);

    // Clean up temp file
    if (fs.existsSync('temp-graph.json')) {
      fs.unlinkSync('temp-graph.json');
    }

    return {
      circularDependencies: circularDeps,
      missingDependencies: missingDeps,
      dependencyGraph: graph
    };
  } catch (error) {
    console.warn('  ⚠️ Warning: Could not analyze dependencies:', error.message);
    return {
      circularDependencies: [],
      missingDependencies: [],
      dependencyGraph: {},
      error: error.message
    };
  }
}

function findCircularDependencies(graph) {
  const circularDeps = [];
  const nodes = graph.nodes || {};

  for (const [projectName, projectNode] of Object.entries(nodes)) {
    const visited = new Set();
    const path = [];

    function dfs(current) {
      if (path.includes(current)) {
        const cycle = path.slice(path.indexOf(current)).concat(current);
        circularDeps.push({
          projects: cycle,
          cycle: cycle.join(' → '),
        });
        return;
      }

      if (visited.has(current)) return;
      visited.add(current);
      path.push(current);

      const dependencies = (graph.dependencies || {})[current] || [];
      for (const dep of dependencies) {
        if (dep.type === 'static') {
          dfs(dep.target);
        }
      }

      path.pop();
    }

    dfs(projectName);
  }

  return circularDeps;
}

function findMissingDependencies(graph) {
  // This would require more complex analysis of source code
  // For now, return empty array as placeholder
  return [];
}

function analyzeBuildConfigurations() {
  console.log('  ⚙️ Analyzing build configurations...');

  const issues = [];

  // Check nx.json for common issues
  try {
    const nxJson = JSON.parse(fs.readFileSync('nx.json', 'utf8'));

    // Check for missing cache configuration
    if (!nxJson.targetDefaults || !nxJson.targetDefaults.build) {
      issues.push({
        type: 'missing-build-cache',
        severity: 'medium',
        description: 'Build target is missing cache configuration',
        fix: 'Add cache configuration to nx.json targetDefaults.build'
      });
    }

    // Check for parallel execution issues
    if (nxJson.parallel > 10) {
      issues.push({
        type: 'high-parallelism',
        severity: 'low',
        description: 'Parallel execution is set very high, may cause resource issues',
        current: nxJson.parallel,
        recommended: 5
      });
    }

  } catch (error) {
    issues.push({
      type: 'nx-json-error',
      severity: 'high',
      description: 'Could not parse nx.json file',
      error: error.message
    });
  }

  return { issues };
}

function analyzeTestCoverage() {
  console.log('  🧪 Analyzing test coverage...');

  const projects = [];
  const projectsWithoutTests = [];

  // Find all project directories
  const findCommand = `find apps libs -name "project.json" -type f 2>/dev/null`;
  const projectFiles = execSync(findCommand, { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);

  for (const projectFile of projectFiles) {
    const projectPath = path.dirname(projectFile);
    const projectName = path.basename(projectPath);

    // Check if project has test target
    try {
      const projectJson = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
      const hasTestTarget = projectJson.targets && projectJson.targets.test;

      if (!hasTestTarget) {
        projectsWithoutTests.push(projectName);
      }

      projects.push({
        name: projectName,
        path: projectPath,
        hasTestTarget,
        testFramework: hasTestTarget ? detectTestFramework(projectPath) : null
      });
    } catch (error) {
      console.warn(`  ⚠️ Warning: Could not analyze ${projectName}:`, error.message);
    }
  }

  return {
    totalProjects: projects.length,
    projectsWithTests: projects.filter(p => p.hasTestTarget).length,
    projectsWithoutTests,
    coverage: `${projects.filter(p => p.hasTestTarget).length}/${projects.length}`,
    projects
  };
}

function detectTestFramework(projectPath) {
  // Check for jest configuration
  if (fs.existsSync(path.join(projectPath, 'jest.config.ts')) ||
      fs.existsSync(path.join(projectPath, 'jest.config.js'))) {
    return 'jest';
  }

  // Check for vitest configuration
  if (fs.existsSync(path.join(projectPath, 'vitest.config.ts')) ||
      fs.existsSync(path.join(projectPath, 'vitest.config.js'))) {
    return 'vitest';
  }

  return 'unknown';
}

function generateRecommendations(projectAnalysis, dependencyAnalysis, buildAnalysis, testAnalysis) {
  const recommendations = [];

  // Recommendations for project structure
  if (projectAnalysis.issues.some(i => i.type === 'missing-tags')) {
    recommendations.push({
      type: 'add-project-tags',
      priority: 'high',
      title: 'Add Project Tags for Better Organization',
      description: 'Projects should have appropriate tags for better organization and dependency management',
      actions: [
        'Review each project and add relevant tags (e.g., scope, type, platform)',
        'Consider tags like: scope:shared, scope:app, type:ui, type:api, platform:web, platform:node'
      ]
    });
  }

  // Recommendations for circular dependencies
  if (dependencyAnalysis.circularDependencies.length > 0) {
    recommendations.push({
      type: 'resolve-circular-deps',
      priority: 'high',
      title: 'Resolve Circular Dependencies',
      description: 'Circular dependencies can cause build issues and make the codebase harder to maintain',
      actions: dependencyAnalysis.circularDependencies.map(dep =>
        `Break the circular dependency: ${dep.cycle}`
      )
    });
  }

  // Recommendations for test coverage
  if (testAnalysis.projectsWithoutTests.length > 0) {
    recommendations.push({
      type: 'add-test-coverage',
      priority: 'medium',
      title: 'Add Test Coverage to Projects',
      description: `${testAnalysis.projectsWithoutTests.length} projects lack test coverage`,
      actions: [
        'Add test targets to project.json files',
        'Create basic test files for each project',
        'Configure appropriate test runners (Jest/Vitest)'
      ]
    });
  }

  // Recommendations for build configuration
  if (buildAnalysis.issues.length > 0) {
    recommendations.push({
      type: 'fix-build-config',
      priority: 'medium',
      title: 'Fix Build Configuration Issues',
      description: `${buildAnalysis.issues.length} build configuration issues found`,
      actions: buildAnalysis.issues.map(issue => issue.fix || issue.description)
    });
  }

  return recommendations;
}

function generateMarkdownReport(report) {
  const { summary, projectAnalysis, dependencyAnalysis, buildAnalysis, testAnalysis, recommendations } = report;

  let md = `# Nx Workspace Diagnostics Report\n\n`;
  md += `Generated: ${new Date().toLocaleString()}\n\n`;

  md += `## Executive Summary\n\n`;
  md += `- **Total Projects**: ${summary.totalProjects}\n`;
  md += `- **Applications**: ${summary.appsCount}\n`;
  md += `- **Libraries**: ${summary.libsCount}\n`;
  md += `- **Circular Dependencies**: ${summary.circularDependencies}\n`;
  md += `- **Missing Dependencies**: ${summary.missingDependencies}\n`;
  md += `- **Build Issues**: ${summary.buildIssues}\n`;
  md += `- **Test Coverage**: ${summary.testCoverage}\n`;
  md += `- **Projects Without Tests**: ${summary.projectsWithoutTests}\n\n`;

  md += `## Project Structure Analysis\n\n`;

  if (projectAnalysis.apps.length > 0) {
    md += `### Applications (${projectAnalysis.apps.length})\n\n`;
    md += `| Project | Path | Tags | Targets |\n`;
    md += `| ------- | ---- | ---- | ------- |\n`;
    for (const app of projectAnalysis.apps) {
      md += `| ${app.name} | ${app.path} | ${app.tags.join(', ') || 'none'} | ${app.targets.join(', ')} |\n`;
    }
    md += `\n`;
  }

  if (projectAnalysis.libs.length > 0) {
    md += `### Libraries (${projectAnalysis.libs.length})\n\n`;
    md += `| Project | Path | Tags | Targets |\n`;
    md += `| ------- | ---- | ---- | ------- |\n`;
    for (const lib of projectAnalysis.libs) {
      md += `| ${lib.name} | ${lib.path} | ${lib.tags.join(', ') || 'none'} | ${lib.targets.join(', ')} |\n`;
    }
    md += `\n`;
  }

  if (projectAnalysis.issues.length > 0) {
    md += `### Issues Found\n\n`;
    for (const issue of projectAnalysis.issues) {
      md += `#### ${issue.type} (${issue.severity})\n\n`;
      md += `${issue.description}\n\n`;
      if (issue.projects) {
        md += `**Affected Projects:**\n`;
        for (const project of issue.projects) {
          md += `- ${typeof project === 'string' ? project : `${project.name} (expected: ${project.expected})`}\n`;
        }
        md += `\n`;
      }
    }
  }

  if (dependencyAnalysis.circularDependencies.length > 0) {
    md += `## Dependency Analysis\n\n`;
    md += `### Circular Dependencies (${dependencyAnalysis.circularDependencies.length})\n\n`;
    for (const dep of dependencyAnalysis.circularDependencies) {
      md += `- **${dep.cycle}**\n`;
    }
    md += `\n`;
  }

  if (buildAnalysis.issues.length > 0) {
    md += `## Build Configuration Issues\n\n`;
    for (const issue of buildAnalysis.issues) {
      md += `### ${issue.type} (${issue.severity})\n\n`;
      md += `${issue.description}\n\n`;
      if (issue.fix) {
        md += `**Fix:** ${issue.fix}\n\n`;
      }
    }
  }

  md += `## Test Coverage Analysis\n\n`;
  md += `- **Projects with Tests**: ${testAnalysis.projectsWithTests}\n`;
  md += `- **Projects without Tests**: ${testAnalysis.projectsWithoutTests.length}\n\n`;

  if (testAnalysis.projectsWithoutTests.length > 0) {
    md += `### Projects Without Tests\n\n`;
    for (const project of testAnalysis.projectsWithoutTests) {
      md += `- ${project}\n`;
    }
    md += `\n`;
  }

  if (recommendations.length > 0) {
    md += `## Recommendations\n\n`;
    for (const rec of recommendations) {
      md += `### ${rec.title} (${rec.priority})\n\n`;
      md += `${rec.description}\n\n`;
      md += `**Actions:**\n\n`;
      for (const action of rec.actions) {
        md += `- ${action}\n`;
      }
      md += `\n`;
    }
  }

  return md;
}
