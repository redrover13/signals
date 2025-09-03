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

console.log('🔧 Nx Build Configuration Analysis Tool');
console.log('=======================================');

try {
  // Get all projects
  console.log('\n📊 Getting project configurations...');
  const projects = getAllProjects();
  console.log(`  📁 Found ${projects.length} projects`);

  // Analyze build configurations
  console.log('🔍 Analyzing build configurations...');
  const buildAnalysis = analyzeBuildConfigurations(projects);

  // Generate recommendations
  console.log('💡 Generating build recommendations...');
  const recommendations = generateBuildRecommendations(buildAnalysis);

  // Create build fix scripts
  console.log('🔧 Creating build fix scripts...');
  createBuildScripts(buildAnalysis, recommendations);

  // Generate report
  const report = {
    timestamp,
    analysis: buildAnalysis,
    recommendations,
    fixes: generateBuildFixReport(buildAnalysis, recommendations)
  };

  // Save report as JSON
  const jsonReportPath = path.join(outputDir, `nx-build-config-${timestamp}.json`);
  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
  console.log(`✅ JSON report saved to: ${jsonReportPath}`);

  // Save report as Markdown
  const mdReportPath = path.join(outputDir, `nx-build-config-${timestamp}.md`);
  fs.writeFileSync(mdReportPath, generateBuildMarkdownReport(report));
  console.log(`✅ Markdown report saved to: ${mdReportPath}`);

  console.log('\n✨ Build configuration analysis completed!');
  console.log(`📊 Projects analyzed: ${buildAnalysis.totalProjects}`);
  console.log(`⚠️  Configuration issues: ${buildAnalysis.issues.length}`);
  console.log(`📝 Generated ${recommendations.length} recommendations`);

} catch (error) {
  console.error('❌ Error during build configuration analysis:', error);
  process.exit(1);
}

function getAllProjects() {
  try {
    const output = execSync('find apps libs -name "project.json" -type f', { encoding: 'utf8' });
    const projectFiles = output.trim().split('\n').filter(Boolean);

    return projectFiles.map(file => {
      const projectDir = path.dirname(file);
      const projectJson = JSON.parse(fs.readFileSync(file, 'utf8'));
      const packageJsonPath = path.join(projectDir, 'package.json');

      let packageJson = null;
      if (fs.existsSync(packageJsonPath)) {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      }

      return {
        name: projectJson.name || path.basename(projectDir),
        root: projectDir,
        projectJson,
        packageJson,
        type: projectDir.startsWith('apps/') ? 'app' : 'lib'
      };
    });
  } catch (error) {
    console.warn('Warning: Could not get all projects, using fallback method');
    return [];
  }
}

function analyzeBuildConfigurations(projects) {
  const issues = [];
  const buildConfigs = [];
  const lintConfigs = [];
  const testConfigs = [];

  for (const project of projects) {
    // Analyze build configuration
    const buildConfig = analyzeBuildConfig(project);
    if (buildConfig.issues.length > 0) {
      issues.push(...buildConfig.issues.map(issue => ({ ...issue, project: project.name })));
    }
    if (buildConfig.config) {
      buildConfigs.push({ project: project.name, config: buildConfig.config });
    }

    // Analyze lint configuration
    const lintConfig = analyzeLintConfig(project);
    if (lintConfig.issues.length > 0) {
      issues.push(...lintConfig.issues.map(issue => ({ ...issue, project: project.name })));
    }
    if (lintConfig.config) {
      lintConfigs.push({ project: project.name, config: lintConfig.config });
    }

    // Analyze test configuration
    const testConfig = analyzeTestConfig(project);
    if (testConfig.issues.length > 0) {
      issues.push(...testConfig.issues.map(issue => ({ ...issue, project: project.name })));
    }
    if (testConfig.config) {
      testConfigs.push({ project: project.name, config: testConfig.config });
    }
  }

  // Analyze configuration consistency
  const consistencyIssues = analyzeConfigurationConsistency(buildConfigs, lintConfigs, testConfigs);
  issues.push(...consistencyIssues);

  return {
    totalProjects: projects.length,
    issues,
    buildConfigs,
    lintConfigs,
    testConfigs,
    consistencyAnalysis: analyzeConsistencyPatterns(buildConfigs, lintConfigs, testConfigs)
  };
}

function analyzeBuildConfig(project) {
  const issues = [];
  let config = null;

  // Check for build target
  if (project.projectJson.targets) {
    if (project.projectJson.targets.build) {
      config = project.projectJson.targets.build;
    } else if (project.projectJson.targets['build:lib']) {
      config = project.projectJson.targets['build:lib'];
    }
  }

  if (!config) {
    issues.push({
      type: 'missing-build-target',
      severity: 'high',
      message: 'Missing build target in project.json',
      suggestion: 'Add a build target with appropriate executor'
    });
    return { config, issues };
  }

  // Check executor
  if (!config.executor) {
    issues.push({
      type: 'missing-executor',
      severity: 'high',
      message: 'Build target missing executor',
      suggestion: 'Specify an executor (e.g., @nx/vite:build, @nx/rollup:rollup)'
    });
  } else {
    // Validate executor
    const validExecutors = [
      '@nx/vite:build',
      '@nx/rollup:rollup',
      '@nx/esbuild:esbuild',
      '@nx/webpack:webpack',
      '@nx/next:build',
      '@nx/react:build',
      '@nx/js:tsc'
    ];

    if (!validExecutors.some(executor => config.executor.includes(executor))) {
      issues.push({
        type: 'invalid-executor',
        severity: 'medium',
        message: `Unknown build executor: ${config.executor}`,
        suggestion: 'Use a standard Nx executor or custom executor'
      });
    }
  }

  // Check for output configuration
  if (!config.outputs || config.outputs.length === 0) {
    issues.push({
      type: 'missing-outputs',
      severity: 'medium',
      message: 'Build target missing output configuration',
      suggestion: 'Add outputs array to specify build artifacts'
    });
  }

  // Check for caching
  if (config.cache !== false && !config.inputs) {
    issues.push({
      type: 'missing-cache-inputs',
      severity: 'low',
      message: 'Build target could benefit from explicit cache inputs',
      suggestion: 'Add inputs array for better caching'
    });
  }

  return { config, issues };
}

function analyzeLintConfig(project) {
  const issues = [];
  let config = null;

  // Check for lint target
  if (project.projectJson.targets && project.projectJson.targets.lint) {
    config = project.projectJson.targets.lint;
  }

  if (!config) {
    issues.push({
      type: 'missing-lint-target',
      severity: 'medium',
      message: 'Missing lint target in project.json',
      suggestion: 'Add ESLint target for code quality'
    });
    return { config, issues };
  }

  // Check executor
  if (!config.executor) {
    issues.push({
      type: 'missing-lint-executor',
      severity: 'high',
      message: 'Lint target missing executor',
      suggestion: 'Use @nx/eslint:lint executor'
    });
  } else if (!config.executor.includes('@nx/eslint:lint')) {
    issues.push({
      type: 'invalid-lint-executor',
      severity: 'medium',
      message: `Unexpected lint executor: ${config.executor}`,
      suggestion: 'Use @nx/eslint:lint for consistency'
    });
  }

  return { config, issues };
}

function analyzeTestConfig(project) {
  const issues = [];
  let config = null;

  // Check for test target
  if (project.projectJson.targets) {
    if (project.projectJson.targets.test) {
      config = project.projectJson.targets.test;
    } else if (project.projectJson.targets['test:unit']) {
      config = project.projectJson.targets['test:unit'];
    }
  }

  if (!config) {
    issues.push({
      type: 'missing-test-target',
      severity: 'high',
      message: 'Missing test target in project.json',
      suggestion: 'Add test target for unit testing'
    });
    return { config, issues };
  }

  // Check executor
  if (!config.executor) {
    issues.push({
      type: 'missing-test-executor',
      severity: 'high',
      message: 'Test target missing executor',
      suggestion: 'Use @nx/jest:jest or @nx/vite:test executor'
    });
  } else {
    const validExecutors = ['@nx/jest:jest', '@nx/vite:test'];
    if (!validExecutors.some(executor => config.executor.includes(executor))) {
      issues.push({
        type: 'invalid-test-executor',
        severity: 'medium',
        message: `Unknown test executor: ${config.executor}`,
        suggestion: 'Use @nx/jest:jest or @nx/vite:test'
      });
    }
  }

  return { config, issues };
}

function analyzeConfigurationConsistency(buildConfigs, lintConfigs, testConfigs) {
  const issues = [];

  // Check for inconsistent build executors
  const buildExecutors = {};
  for (const config of buildConfigs) {
    const executor = config.config.executor;
    if (executor) {
      if (!buildExecutors[executor]) {
        buildExecutors[executor] = [];
      }
      buildExecutors[executor].push(config.project);
    }
  }

  const buildExecutorTypes = Object.keys(buildExecutors);
  if (buildExecutorTypes.length > 3) {
    issues.push({
      type: 'inconsistent-build-executors',
      severity: 'low',
      message: `Multiple build executors used: ${buildExecutorTypes.join(', ')}`,
      suggestion: 'Consider standardizing build executors across similar projects',
      affectedProjects: Object.values(buildExecutors).flat()
    });
  }

  // Check for missing lint configurations
  const projectsWithLint = lintConfigs.map(c => c.project);
  const projectsWithoutLint = buildConfigs
    .map(c => c.project)
    .filter(p => !projectsWithLint.includes(p));

  if (projectsWithoutLint.length > 0) {
    issues.push({
      type: 'missing-lint-configs',
      severity: 'medium',
      message: `${projectsWithoutLint.length} projects missing lint configuration`,
      suggestion: 'Add ESLint configuration to all projects',
      affectedProjects: projectsWithoutLint
    });
  }

  // Check for missing test configurations
  const projectsWithTest = testConfigs.map(c => c.project);
  const projectsWithoutTest = buildConfigs
    .map(c => c.project)
    .filter(p => !projectsWithTest.includes(p));

  if (projectsWithoutTest.length > 0) {
    issues.push({
      type: 'missing-test-configs',
      severity: 'high',
      message: `${projectsWithoutTest.length} projects missing test configuration`,
      suggestion: 'Add test configuration to all projects',
      affectedProjects: projectsWithoutTest
    });
  }

  return issues;
}

function analyzeConsistencyPatterns(buildConfigs, lintConfigs, testConfigs) {
  return {
    buildExecutorDistribution: getExecutorDistribution(buildConfigs),
    lintExecutorDistribution: getExecutorDistribution(lintConfigs),
    testExecutorDistribution: getExecutorDistribution(testConfigs),
    configurationCompleteness: {
      withBuild: buildConfigs.length,
      withLint: lintConfigs.length,
      withTest: testConfigs.length
    }
  };
}

function getExecutorDistribution(configs) {
  const distribution = {};
  for (const config of configs) {
    const executor = config.config.executor;
    if (executor) {
      distribution[executor] = (distribution[executor] || 0) + 1;
    }
  }
  return distribution;
}

function generateBuildRecommendations(analysis) {
  const recommendations = [];

  // Group issues by type
  const issuesByType = {};
  for (const issue of analysis.issues) {
    if (!issuesByType[issue.type]) {
      issuesByType[issue.type] = [];
    }
    issuesByType[issue.type].push(issue);
  }

  // Handle missing build targets
  if (issuesByType['missing-build-target']) {
    const projects = issuesByType['missing-build-target'].map(i => i.project);
    recommendations.push({
      type: 'add-missing-build-targets',
      priority: 'high',
      title: `Add Missing Build Targets (${projects.length} projects)`,
      description: 'Several projects are missing build targets in their project.json files.',
      actions: [
        'Add build targets with appropriate executors',
        'Configure output directories',
        'Set up proper caching and inputs',
        'Test build process for each project'
      ],
      affectedProjects: projects,
      fixScript: `nx-diagnostics/scripts/fixes/add-build-targets.sh`
    });
  }

  // Handle missing test configurations
  if (issuesByType['missing-test-configs']) {
    const issue = issuesByType['missing-test-configs'][0];
    recommendations.push({
      type: 'add-missing-test-configs',
      priority: 'high',
      title: `Add Missing Test Configurations (${issue.affectedProjects.length} projects)`,
      description: 'Several projects are missing test configurations.',
      actions: [
        'Add test targets to project.json files',
        'Choose appropriate test executor (Jest or Vitest)',
        'Configure test file patterns',
        'Set up test environment and dependencies'
      ],
      affectedProjects: issue.affectedProjects,
      fixScript: `nx-diagnostics/scripts/fixes/add-test-configs.sh`
    });
  }

  // Handle missing lint configurations
  if (issuesByType['missing-lint-configs']) {
    const issue = issuesByType['missing-lint-configs'][0];
    recommendations.push({
      type: 'add-missing-lint-configs',
      priority: 'medium',
      title: `Add Missing Lint Configurations (${issue.affectedProjects.length} projects)`,
      description: 'Several projects are missing ESLint configurations.',
      actions: [
        'Add lint targets to project.json files',
        'Configure ESLint with appropriate rules',
        'Set up lint caching and inputs',
        'Integrate with Nx lint command'
      ],
      affectedProjects: issue.affectedProjects,
      fixScript: `nx-diagnostics/scripts/fixes/add-lint-configs.sh`
    });
  }

  // Handle inconsistent executors
  if (issuesByType['inconsistent-build-executors']) {
    const issue = issuesByType['inconsistent-build-executors'][0];
    recommendations.push({
      type: 'standardize-executors',
      priority: 'low',
      title: 'Standardize Build Executors',
      description: 'Multiple build executors are being used across projects.',
      actions: [
        'Choose a primary build executor for each project type',
        'Migrate projects to use consistent executors',
        'Update documentation and CI/CD configurations',
        'Ensure all executors are properly configured'
      ],
      affectedProjects: issue.affectedProjects,
      fixScript: `nx-diagnostics/scripts/fixes/standardize-executors.sh`
    });
  }

  return recommendations;
}

function createBuildScripts(analysis, recommendations) {
  const fixesDir = path.join(__dirname, '../scripts/fixes');
  if (!fs.existsSync(fixesDir)) {
    fs.mkdirSync(fixesDir, { recursive: true });
  }

  // Create fix scripts for each recommendation
  for (const rec of recommendations) {
    if (rec.fixScript) {
      const scriptPath = path.join(__dirname, '..', rec.fixScript);
      const scriptDir = path.dirname(scriptPath);

      if (!fs.existsSync(scriptDir)) {
        fs.mkdirSync(scriptDir, { recursive: true });
      }

      let scriptContent = '#!/bin/bash\n\n';
      scriptContent += `# Fix script for: ${rec.title}\n`;
      scriptContent += `# Generated: ${new Date().toISOString()}\n\n`;

      switch (rec.type) {
        case 'add-missing-build-targets':
          scriptContent += '# Add missing build targets\n';
          scriptContent += 'echo "Adding build targets to projects..."\n';
          for (const project of rec.affectedProjects) {
            scriptContent += `echo "Adding build target to ${project}"\n`;
            scriptContent += `# TODO: Add build target to ${project}/project.json\n`;
          }
          break;

        case 'add-missing-test-configs':
          scriptContent += '# Add missing test configurations\n';
          scriptContent += 'echo "Adding test configurations to projects..."\n';
          for (const project of rec.affectedProjects) {
            scriptContent += `echo "Adding test config to ${project}"\n`;
            scriptContent += `npx nx g @nx/jest:jest-project --project=${project} --setupFile=jest --skipFormat\n`;
          }
          break;

        case 'add-missing-lint-configs':
          scriptContent += '# Add missing lint configurations\n';
          scriptContent += 'echo "Adding lint configurations to projects..."\n';
          for (const project of rec.affectedProjects) {
            scriptContent += `echo "Adding lint config to ${project}"\n`;
            scriptContent += `npx nx g @nx/eslint:lint-project --project=${project} --skipFormat\n`;
          }
          break;

        default:
          scriptContent += '# Generic build fix script\n';
          scriptContent += 'echo "Please implement the specific build fix"\n';
      }

      fs.writeFileSync(scriptPath, scriptContent);
      fs.chmodSync(scriptPath, '755');
    }
  }

  console.log(`  📝 Created ${recommendations.filter(r => r.fixScript).length} build fix scripts`);
}

function generateBuildFixReport(analysis, recommendations) {
  const fixes = [];

  for (const rec of recommendations) {
    if (rec.fixScript) {
      fixes.push({
        type: rec.type,
        title: rec.title,
        script: rec.fixScript,
        priority: rec.priority,
        affectedProjects: rec.affectedProjects
      });
    }
  }

  return fixes;
}

function generateBuildMarkdownReport(report) {
  const { analysis, recommendations, fixes } = report;

  let md = `# Nx Build Configuration Analysis Report\n\n`;
  md += `Generated: ${new Date().toLocaleString()}\n\n`;

  md += `## Summary\n\n`;
  md += `- **Total Projects**: ${analysis.totalProjects}\n`;
  md += `- **Configuration Issues**: ${analysis.issues.length}\n`;
  md += `- **Projects with Build Config**: ${analysis.buildConfigs.length}\n`;
  md += `- **Projects with Lint Config**: ${analysis.lintConfigs.length}\n`;
  md += `- **Projects with Test Config**: ${analysis.testConfigs.length}\n`;
  md += `- **Recommendations**: ${recommendations.length}\n\n`;

  if (analysis.issues.length > 0) {
    md += `## Configuration Issues\n\n`;
    const issuesBySeverity = {
      high: analysis.issues.filter(i => i.severity === 'high'),
      medium: analysis.issues.filter(i => i.severity === 'medium'),
      low: analysis.issues.filter(i => i.severity === 'low')
    };

    for (const [severity, issues] of Object.entries(issuesBySeverity)) {
      if (issues.length > 0) {
        md += `### ${severity.charAt(0).toUpperCase() + severity.slice(1)} Priority Issues\n\n`;
        for (const issue of issues) {
          md += `#### ${issue.project}: ${issue.message}\n\n`;
          md += `**Suggestion:** ${issue.suggestion}\n\n`;
        }
      }
    }
  }

  md += `## Configuration Consistency\n\n`;
  md += `### Build Executors\n\n`;
  for (const [executor, count] of Object.entries(analysis.consistencyAnalysis.buildExecutorDistribution)) {
    md += `- ${executor}: ${count} projects\n`;
  }
  md += `\n`;

  md += `### Test Executors\n\n`;
  for (const [executor, count] of Object.entries(analysis.consistencyAnalysis.testExecutorDistribution)) {
    md += `- ${executor}: ${count} projects\n`;
  }
  md += `\n`;

  md += `### Lint Executors\n\n`;
  for (const [executor, count] of Object.entries(analysis.consistencyAnalysis.lintExecutorDistribution)) {
    md += `- ${executor}: ${count} projects\n`;
  }
  md += `\n`;

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
      if (rec.affectedProjects && rec.affectedProjects.length > 0) {
        md += `**Affected Projects:** ${rec.affectedProjects.join(', ')}\n\n`;
      }
    }
  }

  if (fixes.length > 0) {
    md += `## Generated Fix Scripts\n\n`;
    for (const fix of fixes) {
      md += `### ${fix.title}\n\n`;
      md += `- **Script:** \`${fix.script}\`\n`;
      md += `- **Priority:** ${fix.priority}\n`;
      md += `- **Affected:** ${fix.affectedProjects.join(', ')}\n\n`;
    }
  }

  return md;
}
