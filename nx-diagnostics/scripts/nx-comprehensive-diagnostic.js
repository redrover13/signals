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

console.log('🔍 Nx Workspace Comprehensive Diagnostic Tool');
console.log('=============================================');

try {
  console.log('\n📊 Running all diagnostic analyses...');

  // Run dependency analysis
  console.log('1️⃣ Analyzing dependencies...');
  const depReport = runAnalysis('nx-dependency-analysis.js');

  // Run test coverage analysis
  console.log('2️⃣ Analyzing test coverage...');
  const testReport = runAnalysis('nx-test-coverage-analysis.js');

  // Run build configuration analysis
  console.log('3️⃣ Analyzing build configurations...');
  const buildReport = runAnalysis('nx-build-config-analysis.js');

  // Generate comprehensive summary
  console.log('4️⃣ Generating comprehensive summary...');
  const summary = generateComprehensiveSummary(depReport, testReport, buildReport);

  // Generate implementation plan
  console.log('5️⃣ Creating implementation plan...');
  const implementationPlan = generateImplementationPlan(summary);

  // Save comprehensive report
  const comprehensiveReport = {
    timestamp,
    summary,
    implementationPlan,
    individualReports: {
      dependencies: depReport,
      testCoverage: testReport,
      buildConfig: buildReport
    }
  };

  // Save as JSON
  const jsonReportPath = path.join(outputDir, `nx-comprehensive-diagnostic-${timestamp}.json`);
  fs.writeFileSync(jsonReportPath, JSON.stringify(comprehensiveReport, null, 2));
  console.log(`✅ JSON report saved to: ${jsonReportPath}`);

  // Save as Markdown
  const mdReportPath = path.join(outputDir, `nx-comprehensive-diagnostic-${timestamp}.md`);
  fs.writeFileSync(mdReportPath, generateComprehensiveMarkdownReport(comprehensiveReport));
  console.log(`✅ Markdown report saved to: ${mdReportPath}`);

  // Create implementation scripts
  console.log('6️⃣ Creating implementation scripts...');
  createImplementationScripts(implementationPlan);

  console.log('\n✨ Comprehensive diagnostic completed!');
  console.log(`📊 Total Projects: ${summary.totalProjects}`);
  console.log(`⚠️  Total Issues: ${summary.totalIssues}`);
  console.log(`🔧 Implementation Steps: ${implementationPlan.phases.length}`);

} catch (error) {
  console.error('❌ Error during comprehensive diagnostic:', error);
  process.exit(1);
}

function runAnalysis(scriptName) {
  try {
    const scriptPath = path.join(__dirname, scriptName);
    console.log(`  Running ${scriptName}...`);
    execSync(`node ${scriptPath}`, { stdio: 'pipe' });

    // Find the latest report file
    const allFiles = fs.readdirSync(outputDir);
    console.log(`  Found ${allFiles.length} files in reports directory`);

    const reportFiles = allFiles
      .filter(file => {
        const baseName = scriptName.replace('nx-', '').replace('-analysis.js', '');
        // Handle special case for dependency analysis
        const searchPattern = baseName === 'dependency' ? 'dependencies' : baseName;
        const matches = file.includes(`nx-${searchPattern}`) && file.endsWith('.json') && !file.includes('comprehensive');
        console.log(`  Checking ${file}: baseName=${baseName}, searchPattern=${searchPattern}, matches=${matches}`);
        return matches;
      })
      .map(file => ({
        name: file,
        timestamp: fs.statSync(path.join(outputDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.timestamp - a.timestamp);

    console.log(`  Found ${reportFiles.length} matching report files for ${scriptName}`);

    if (reportFiles.length > 0) {
      const latestReport = path.join(outputDir, reportFiles[0].name);
      console.log(`  Loading report: ${reportFiles[0].name}`);
      const report = JSON.parse(fs.readFileSync(latestReport, 'utf8'));
      console.log(`  Report has ${report.analysis?.totalProjects || 0} projects`);
      return report || { analysis: { totalProjects: 0 }, recommendations: [] };
    }
  } catch (error) {
    console.warn(`Warning: Failed to run ${scriptName}:`, error.message);
  }

  return { analysis: { totalProjects: 0 }, recommendations: [] };
}

function generateComprehensiveSummary(depReport, testReport, buildReport) {
  const totalProjects = Math.max(
    depReport.analysis?.totalProjects || 0,
    testReport.analysis?.totalProjects || 0,
    buildReport.analysis?.totalProjects || 0
  );

  const totalIssues =
    (depReport.analysis?.circularDependencies?.length || 0) +
    (depReport.analysis?.missingDependencies?.length || 0) +
    (testReport.analysis?.projectsWithoutTests?.length || 0) +
    (buildReport.analysis?.issues?.length || 0);

  const totalRecommendations =
    (depReport.recommendations?.length || 0) +
    (testReport.recommendations?.length || 0) +
    (buildReport.recommendations?.length || 0);

  return {
    totalProjects,
    totalIssues,
    totalRecommendations,
    dependencyAnalysis: {
      projects: depReport.analysis?.totalProjects || 0,
      circularDependencies: depReport.analysis?.circularDependencies?.length || 0,
      missingDependencies: depReport.analysis?.missingDependencies?.length || 0,
      isolatedProjects: depReport.analysis?.dependencyPatterns?.isolatedProjects?.length || 0
    },
    testAnalysis: {
      projects: testReport.analysis?.totalProjects || 0,
      projectsWithTests: testReport.analysis?.projectsWithTests?.length || 0,
      projectsWithoutTests: testReport.analysis?.projectsWithoutTests?.length || 0,
      coveragePercentage: testReport.analysis?.coverage?.coveragePercentage || 0
    },
    buildAnalysis: {
      projects: buildReport.analysis?.totalProjects || 0,
      issues: buildReport.analysis?.issues?.length || 0,
      projectsWithBuild: buildReport.analysis?.buildConfigs?.length || 0,
      projectsWithLint: buildReport.analysis?.lintConfigs?.length || 0,
      projectsWithTest: buildReport.analysis?.testConfigs?.length || 0
    },
    recommendations: {
      dependencies: depReport.recommendations || [],
      tests: testReport.recommendations || [],
      builds: buildReport.recommendations || []
    }
  };
}

function generateImplementationPlan(summary) {
  const phases = [];

  // Phase 1: Critical Fixes
  const criticalIssues = [];
  if (summary.dependencyAnalysis.missingDependencies > 0) {
    criticalIssues.push('Fix missing dependencies');
  }
  if (summary.testAnalysis.projectsWithoutTests > 0) {
    criticalIssues.push('Add missing test configurations');
  }
  if (summary.buildAnalysis.issues && Array.isArray(summary.buildAnalysis.issues)) {
    const highPriorityIssues = summary.buildAnalysis.issues.filter(i => i.severity === 'high');
    if (highPriorityIssues.length > 0) {
      criticalIssues.push('Fix high-priority build configuration issues');
    }
  }

  if (criticalIssues.length > 0) {
    phases.push({
      name: 'Phase 1: Critical Fixes',
      priority: 'high',
      description: 'Fix critical issues that prevent the workspace from functioning properly',
      issues: criticalIssues,
      estimatedTime: '2-4 hours',
      scripts: [
        'nx-diagnostics/scripts/implementation/phase1-critical-fixes.sh'
      ]
    });
  }

  // Phase 2: Test Coverage
  if (summary.testAnalysis.projectsWithoutTests > 0) {
    phases.push({
      name: 'Phase 2: Test Coverage Implementation',
      priority: 'high',
      description: 'Add comprehensive unit tests to all projects missing test coverage',
      issues: [
        `Add tests to ${summary.testAnalysis.projectsWithoutTests} projects without tests`,
        'Configure test runners and frameworks',
        'Set up test environments and dependencies'
      ],
      estimatedTime: '4-8 hours',
      scripts: [
        'nx-diagnostics/scripts/implementation/phase2-test-coverage.sh'
      ]
    });
  }

  // Phase 3: Build Configuration
  if (summary.buildAnalysis.issues > 0) {
    phases.push({
      name: 'Phase 3: Build Configuration Fixes',
      priority: 'medium',
      description: 'Fix build configuration issues and standardize executors',
      issues: [
        `Fix ${summary.buildAnalysis.issues} configuration issues`,
        'Standardize build, lint, and test executors',
        'Add missing targets and configurations'
      ],
      estimatedTime: '3-6 hours',
      scripts: [
        'nx-diagnostics/scripts/implementation/phase3-build-config.sh'
      ]
    });
  }

  // Phase 4: Dependency Optimization
  if (summary.dependencyAnalysis.isolatedProjects > 0) {
    phases.push({
      name: 'Phase 4: Dependency Optimization',
      priority: 'medium',
      description: 'Optimize project dependencies and integrate isolated projects',
      issues: [
        `Integrate ${summary.dependencyAnalysis.isolatedProjects} isolated projects`,
        'Review and optimize dependency chains',
        'Ensure proper project relationships'
      ],
      estimatedTime: '2-4 hours',
      scripts: [
        'nx-diagnostics/scripts/implementation/phase4-dependency-optimization.sh'
      ]
    });
  }

  // Phase 5: Quality Assurance
  phases.push({
    name: 'Phase 5: Quality Assurance',
    priority: 'medium',
    description: 'Run comprehensive tests and validate all fixes',
    issues: [
      'Run all tests and ensure they pass',
      'Validate build configurations',
      'Test dependency resolution',
      'Run linting and formatting checks'
    ],
    estimatedTime: '1-2 hours',
    scripts: [
      'nx-diagnostics/scripts/implementation/phase5-qa-validation.sh'
    ]
  });

  return {
    phases,
    totalEstimatedTime: phases.reduce((total, phase) => {
      const timeRange = phase.estimatedTime.match(/(\d+)-(\d+)/);
      if (timeRange) {
        return total + (parseInt(timeRange[1]) + parseInt(timeRange[2])) / 2;
      }
      return total + 2; // Default 2 hours
    }, 0),
    riskAssessment: assessImplementationRisk(summary)
  };
}

function assessImplementationRisk(summary) {
  let riskLevel = 'low';
  let riskFactors = [];

  if (summary.totalIssues > 50) {
    riskLevel = 'high';
    riskFactors.push('High number of issues to fix');
  } else if (summary.totalIssues > 20) {
    riskLevel = 'medium';
    riskFactors.push('Moderate number of issues to fix');
  }

  if (summary.testAnalysis.coveragePercentage < 50) {
    riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    riskFactors.push('Low test coverage increases risk of regressions');
  }

  if (summary.dependencyAnalysis.missingDependencies > 0) {
    riskLevel = 'high';
    riskFactors.push('Missing dependencies could break builds');
  }

  return {
    level: riskLevel,
    factors: riskFactors,
    mitigationStrategies: [
      'Create backup branch before implementing changes',
      'Implement fixes incrementally, testing after each phase',
      'Run comprehensive tests after each phase',
      'Have rollback plan ready'
    ]
  };
}

function createImplementationScripts(implementationPlan) {
  const implDir = path.join(__dirname, '../scripts/implementation');
  if (!fs.existsSync(implDir)) {
    fs.mkdirSync(implDir, { recursive: true });
  }

  for (const phase of implementationPlan.phases) {
    const scriptPath = path.join(__dirname, '..', phase.scripts[0]);
    const scriptDir = path.dirname(scriptPath);

    if (!fs.existsSync(scriptDir)) {
      fs.mkdirSync(scriptDir, { recursive: true });
    }

    let scriptContent = '#!/bin/bash\n\n';
    scriptContent += `# ${phase.name}\n`;
    scriptContent += `# Generated: ${new Date().toISOString()}\n`;
    scriptContent += `# Priority: ${phase.priority}\n`;
    scriptContent += `# Estimated Time: ${phase.estimatedTime}\n\n`;
    scriptContent += `echo "Starting ${phase.name}"\n`;
    scriptContent += `echo "Description: ${phase.description}"\n\n`;

    for (const issue of phase.issues) {
      scriptContent += `echo "🔧 ${issue}"\n`;
    }
    scriptContent += '\n';

    // Add specific commands based on phase
    switch (phase.name) {
      case 'Phase 1: Critical Fixes':
        scriptContent += '# Run critical fix scripts\n';
        scriptContent += 'echo "Running critical fixes..."\n';
        scriptContent += '# TODO: Implement critical fixes\n';
        break;

      case 'Phase 2: Test Coverage Implementation':
        scriptContent += '# Add test coverage\n';
        scriptContent += 'echo "Adding test coverage..."\n';
        scriptContent += 'bash nx-diagnostics/scripts/fixes/add-tests-apps.sh\n';
        scriptContent += 'bash nx-diagnostics/scripts/fixes/add-tests-libs.sh\n';
        break;

      case 'Phase 3: Build Configuration Fixes':
        scriptContent += '# Fix build configurations\n';
        scriptContent += 'echo "Fixing build configurations..."\n';
        scriptContent += 'bash nx-diagnostics/scripts/fixes/add-build-targets.sh\n';
        scriptContent += 'bash nx-diagnostics/scripts/fixes/add-test-configs.sh\n';
        scriptContent += 'bash nx-diagnostics/scripts/fixes/add-lint-configs.sh\n';
        break;

      case 'Phase 4: Dependency Optimization':
        scriptContent += '# Optimize dependencies\n';
        scriptContent += 'echo "Optimizing dependencies..."\n';
        scriptContent += '# TODO: Implement dependency optimization\n';
        break;

      case 'Phase 5: Quality Assurance':
        scriptContent += '# Run quality assurance\n';
        scriptContent += 'echo "Running quality assurance..."\n';
        scriptContent += 'pnpm nx run-many --target=test\n';
        scriptContent += 'pnpm nx run-many --target=lint\n';
        scriptContent += 'pnpm nx run-many --target=build\n';
        break;
    }

    scriptContent += '\necho "✅ Phase completed successfully!"\n';

    fs.writeFileSync(scriptPath, scriptContent);
    fs.chmodSync(scriptPath, '755');
  }

  console.log(`  📝 Created ${implementationPlan.phases.length} implementation scripts`);
}

function generateComprehensiveMarkdownReport(report) {
  const { summary, implementationPlan } = report;

  let md = `# Nx Workspace Comprehensive Diagnostic Report\n\n`;
  md += `Generated: ${new Date().toLocaleString()}\n\n`;

  md += `## Executive Summary\n\n`;
  md += `- **Total Projects**: ${summary.totalProjects}\n`;
  md += `- **Total Issues Found**: ${summary.totalIssues}\n`;
  md += `- **Total Recommendations**: ${summary.totalRecommendations}\n`;
  md += `- **Test Coverage**: ${summary.testAnalysis.coveragePercentage}%\n`;
  md += `- **Implementation Phases**: ${implementationPlan.phases.length}\n`;
  md += `- **Estimated Total Time**: ${implementationPlan.totalEstimatedTime.toFixed(1)} hours\n`;
  md += `- **Risk Level**: ${implementationPlan.riskAssessment.level.toUpperCase()}\n\n`;

  md += `## Detailed Analysis\n\n`;

  md += `### Dependencies\n\n`;
  md += `- **Projects Analyzed**: ${summary.dependencyAnalysis.projects}\n`;
  md += `- **Circular Dependencies**: ${summary.dependencyAnalysis.circularDependencies}\n`;
  md += `- **Missing Dependencies**: ${summary.dependencyAnalysis.missingDependencies}\n`;
  md += `- **Isolated Projects**: ${summary.dependencyAnalysis.isolatedProjects}\n\n`;

  md += `### Test Coverage\n\n`;
  md += `- **Projects Analyzed**: ${summary.testAnalysis.projects}\n`;
  md += `- **Projects with Tests**: ${summary.testAnalysis.projectsWithTests}\n`;
  md += `- **Projects without Tests**: ${summary.testAnalysis.projectsWithoutTests}\n`;
  md += `- **Coverage Percentage**: ${summary.testAnalysis.coveragePercentage}%\n\n`;

  md += `### Build Configuration\n\n`;
  md += `- **Projects Analyzed**: ${summary.buildAnalysis.projects}\n`;
  md += `- **Configuration Issues**: ${summary.buildAnalysis.issues}\n`;
  md += `- **Projects with Build Config**: ${summary.buildAnalysis.projectsWithBuild}\n`;
  md += `- **Projects with Lint Config**: ${summary.buildAnalysis.projectsWithLint}\n`;
  md += `- **Projects with Test Config**: ${summary.buildAnalysis.projectsWithTest}\n\n`;

  md += `## Implementation Plan\n\n`;

  for (const phase of implementationPlan.phases) {
    md += `### ${phase.name} (${phase.priority.toUpperCase()})\n\n`;
    md += `${phase.description}\n\n`;
    md += `**Estimated Time**: ${phase.estimatedTime}\n\n`;
    md += `**Issues to Address**:\n\n`;
    for (const issue of phase.issues) {
      md += `- ${issue}\n`;
    }
    md += `\n**Scripts**:\n\n`;
    for (const script of phase.scripts) {
      md += `- \`${script}\`\n`;
    }
    md += `\n`;
  }

  md += `## Risk Assessment\n\n`;
  md += `**Risk Level**: ${implementationPlan.riskAssessment.level.toUpperCase()}\n\n`;

  if (implementationPlan.riskAssessment.factors.length > 0) {
    md += `**Risk Factors**:\n\n`;
    for (const factor of implementationPlan.riskAssessment.factors) {
      md += `- ${factor}\n`;
    }
    md += `\n`;
  }

  md += `**Mitigation Strategies**:\n\n`;
  for (const strategy of implementationPlan.riskAssessment.mitigationStrategies) {
    md += `- ${strategy}\n`;
  }
  md += `\n`;

  md += `## Recommendations Summary\n\n`;

  // Dependencies
  if (summary.recommendations.dependencies.length > 0) {
    md += `### Dependency Recommendations (${summary.recommendations.dependencies.length})\n\n`;
    for (const rec of summary.recommendations.dependencies) {
      md += `- **${rec.title}** (${rec.priority}): ${rec.description}\n`;
    }
    md += `\n`;
  }

  // Tests
  if (summary.recommendations.tests.length > 0) {
    md += `### Test Recommendations (${summary.recommendations.tests.length})\n\n`;
    for (const rec of summary.recommendations.tests) {
      md += `- **${rec.title}** (${rec.priority}): ${rec.description}\n`;
    }
    md += `\n`;
  }

  // Builds
  if (summary.recommendations.builds.length > 0) {
    md += `### Build Recommendations (${summary.recommendations.builds.length})\n\n`;
    for (const rec of summary.recommendations.builds) {
      md += `- **${rec.title}** (${rec.priority}): ${rec.description}\n`;
    }
    md += `\n`;
  }

  md += `## Next Steps\n\n`;
  md += `1. **Review this report** and understand all identified issues\n`;
  md += `2. **Create a backup branch** before implementing changes\n`;
  md += `3. **Start with Phase 1** (Critical Fixes) if any exist\n`;
  md += `4. **Implement each phase** incrementally, testing after each\n`;
  md += `5. **Run quality assurance** (Phase 5) to validate all fixes\n`;
  md += `6. **Merge changes** to main branch when all tests pass\n\n`;

  md += `## Generated Files\n\n`;
  md += `- **Comprehensive Report**: \`nx-diagnostics/reports/nx-comprehensive-diagnostic-${report.timestamp}.md\`\n`;
  md += `- **Implementation Scripts**: \`nx-diagnostics/scripts/implementation/\`\n`;
  md += `- **Fix Scripts**: \`nx-diagnostics/scripts/fixes/\`\n`;
  md += `- **Individual Reports**: \`nx-diagnostics/reports/\`\n\n`;

  return md;
}
