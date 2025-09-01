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

console.log('🧪 Nx Test Coverage Analysis Tool');
console.log('=================================');

try {
  // Get all projects
  console.log('\n📊 Getting project list...');
  const projects = getAllProjects();
  console.log(`  📁 Found ${projects.length} projects`);

  // Analyze test coverage
  console.log('🔍 Analyzing test coverage...');
  const testAnalysis = analyzeTestCoverage(projects);

  // Generate recommendations
  console.log('💡 Generating test recommendations...');
  const recommendations = generateTestRecommendations(testAnalysis);

  // Create test generation scripts
  console.log('🔧 Creating test generation scripts...');
  createTestScripts(testAnalysis, recommendations);

  // Generate report
  const report = {
    timestamp,
    analysis: testAnalysis,
    recommendations,
    fixes: generateTestFixReport(testAnalysis, recommendations)
  };

  // Save report as JSON
  const jsonReportPath = path.join(outputDir, `nx-test-coverage-${timestamp}.json`);
  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
  console.log(`✅ JSON report saved to: ${jsonReportPath}`);

  // Save report as Markdown
  const mdReportPath = path.join(outputDir, `nx-test-coverage-${timestamp}.md`);
  fs.writeFileSync(mdReportPath, generateTestMarkdownReport(report));
  console.log(`✅ Markdown report saved to: ${mdReportPath}`);

  console.log('\n✨ Test coverage analysis completed!');
  console.log(`📊 Projects with tests: ${testAnalysis.projectsWithTests.length}`);
  console.log(`❌ Projects without tests: ${testAnalysis.projectsWithoutTests.length}`);
  console.log(`📝 Generated ${recommendations.length} recommendations`);

} catch (error) {
  console.error('❌ Error during test coverage analysis:', error);
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

function analyzeTestCoverage(projects) {
  const projectsWithTests = [];
  const projectsWithoutTests = [];
  const testConfigurations = [];

  for (const project of projects) {
    const hasTests = checkProjectForTests(project);

    if (hasTests.hasTests) {
      projectsWithTests.push({
        name: project.name,
        type: project.type,
        testFiles: hasTests.testFiles,
        testConfig: hasTests.testConfig,
        coverage: hasTests.coverage
      });
    } else {
      projectsWithoutTests.push({
        name: project.name,
        type: project.type,
        root: project.root,
        reason: hasTests.reason
      });
    }

    if (hasTests.testConfig) {
      testConfigurations.push({
        project: project.name,
        config: hasTests.testConfig
      });
    }
  }

  return {
    totalProjects: projects.length,
    projectsWithTests,
    projectsWithoutTests,
    testConfigurations,
    coverage: calculateOverallCoverage(projectsWithTests)
  };
}

function checkProjectForTests(project) {
  const testFiles = [];
  const root = project.root;

  // Check for test files
  const testPatterns = [
    'src/**/*.test.ts',
    'src/**/*.test.js',
    'src/**/*.spec.ts',
    'src/**/*.spec.js',
    'tests/**/*.test.ts',
    'tests/**/*.test.js',
    'tests/**/*.spec.ts',
    'tests/**/*.spec.js',
    '__tests__/**/*.test.ts',
    '__tests__/**/*.test.js',
    '__tests__/**/*.spec.ts',
    '__tests__/**/*.spec.js'
  ];

  for (const pattern of testPatterns) {
    try {
      const output = execSync(`find "${root}" -name "${pattern.split('/').pop()}" -type f 2>/dev/null || true`, { encoding: 'utf8' });
      const files = output.trim().split('\n').filter(Boolean);
      testFiles.push(...files);
    } catch (error) {
      // Ignore find errors
    }
  }

  // Check for test configuration in project.json
  let testConfig = null;
  if (project.projectJson.targets) {
    if (project.projectJson.targets.test) {
      testConfig = project.projectJson.targets.test;
    } else if (project.projectJson.targets['test:unit']) {
      testConfig = project.projectJson.targets['test:unit'];
    }
  }

  // Check for Jest/Vitest configuration
  let jestConfig = null;
  let vitestConfig = null;

  const jestConfigFiles = ['jest.config.js', 'jest.config.ts', 'jest.config.json'];
  const vitestConfigFiles = ['vitest.config.js', 'vitest.config.ts', 'vite.config.ts'];

  for (const configFile of jestConfigFiles) {
    if (fs.existsSync(path.join(root, configFile))) {
      jestConfig = configFile;
      break;
    }
  }

  for (const configFile of vitestConfigFiles) {
    if (fs.existsSync(path.join(root, configFile))) {
      vitestConfig = configFile;
      break;
    }
  }

  // Check for test scripts in package.json
  let testScript = null;
  if (project.packageJson && project.packageJson.scripts) {
    if (project.packageJson.scripts.test) {
      testScript = project.packageJson.scripts.test;
    }
  }

  const hasTests = testFiles.length > 0 || testConfig || jestConfig || vitestConfig || testScript;
  const coverage = testFiles.length > 0 ? 'partial' : 'none';

  if (!hasTests) {
    let reason = 'No test files found';
    if (!testConfig && !jestConfig && !vitestConfig && !testScript) {
      reason = 'No test configuration or test files found';
    }
    return { hasTests: false, reason };
  }

  return {
    hasTests: true,
    testFiles,
    testConfig,
    jestConfig,
    vitestConfig,
    testScript,
    coverage
  };
}

function calculateOverallCoverage(projectsWithTests) {
  const totalProjects = projectsWithTests.length;
  const projectsWithFullCoverage = projectsWithTests.filter(p => p.coverage === 'full').length;
  const projectsWithPartialCoverage = projectsWithTests.filter(p => p.coverage === 'partial').length;

  return {
    totalTestedProjects: totalProjects,
    fullCoverage: projectsWithFullCoverage,
    partialCoverage: projectsWithPartialCoverage,
    noneCoverage: 0,
    coveragePercentage: totalProjects > 0 ? ((projectsWithFullCoverage + projectsWithPartialCoverage) / totalProjects * 100).toFixed(1) : 0
  };
}

function generateTestRecommendations(analysis) {
  const recommendations = [];

  // Handle projects without tests
  if (analysis.projectsWithoutTests.length > 0) {
    const highPriorityProjects = analysis.projectsWithoutTests.filter(p => p.type === 'app');
    const mediumPriorityProjects = analysis.projectsWithoutTests.filter(p => p.type === 'lib');

    if (highPriorityProjects.length > 0) {
      recommendations.push({
        type: 'add-tests-high-priority',
        priority: 'high',
        title: `Add Unit Tests for Applications (${highPriorityProjects.length} projects)`,
        description: `Critical applications are missing unit tests. Applications should have comprehensive test coverage.`,
        actions: [
          'Generate Jest/Vitest configuration for each application',
          'Create basic test files for main functionality',
          'Set up test runners in project.json targets',
          'Add test scripts to package.json'
        ],
        affectedProjects: highPriorityProjects.map(p => p.name),
        fixScript: `nx-diagnostics/scripts/fixes/add-tests-apps.sh`
      });
    }

    if (mediumPriorityProjects.length > 0) {
      recommendations.push({
        type: 'add-tests-medium-priority',
        priority: 'medium',
        title: `Add Unit Tests for Libraries (${mediumPriorityProjects.length} projects)`,
        description: `Shared libraries should have unit tests to ensure reliability and prevent regressions.`,
        actions: [
          'Generate Jest/Vitest configuration for each library',
          'Create unit tests for exported functions and classes',
          'Set up test coverage reporting',
          'Add test targets to project.json'
        ],
        affectedProjects: mediumPriorityProjects.map(p => p.name),
        fixScript: `nx-diagnostics/scripts/fixes/add-tests-libs.sh`
      });
    }
  }

  // Handle test configuration inconsistencies
  if (analysis.testConfigurations.length > 0) {
    const jestProjects = analysis.testConfigurations.filter(c => c.config?.executor?.includes('jest'));
    const vitestProjects = analysis.testConfigurations.filter(c => c.config?.executor?.includes('vite'));

    if (jestProjects.length > 0 && vitestProjects.length > 0) {
      recommendations.push({
        type: 'standardize-test-framework',
        priority: 'medium',
        title: 'Standardize Test Framework',
        description: `The workspace uses both Jest (${jestProjects.length} projects) and Vitest (${vitestProjects.length} projects). Consider standardizing on one framework.`,
        actions: [
          'Choose one test framework (Jest or Vitest) for consistency',
          'Migrate projects to the chosen framework',
          'Update nx.json configuration accordingly',
          'Update CI/CD pipelines to use the standardized framework'
        ],
        affectedProjects: [...jestProjects.map(p => p.project), ...vitestProjects.map(p => p.project)],
        fixScript: `nx-diagnostics/scripts/fixes/standardize-test-framework.sh`
      });
    }
  }

  // Handle low test coverage
  if (analysis.coverage.coveragePercentage < 80) {
    recommendations.push({
      type: 'improve-test-coverage',
      priority: 'medium',
      title: `Improve Test Coverage (${analysis.coverage.coveragePercentage}%)`,
      description: `Overall test coverage is below the recommended 80% threshold.`,
      actions: [
        'Identify untested code paths',
        'Add unit tests for uncovered functions',
        'Add integration tests for complex workflows',
        'Set up coverage reporting and thresholds'
      ],
      affectedProjects: analysis.projectsWithTests.filter(p => p.coverage === 'partial').map(p => p.name),
      fixScript: `nx-diagnostics/scripts/fixes/improve-coverage.sh`
    });
  }

  return recommendations;
}

function createTestScripts(analysis, recommendations) {
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
        case 'add-tests-high-priority':
        case 'add-tests-medium-priority':
          scriptContent += '# Add unit tests to projects\n';
          scriptContent += 'echo "Adding unit tests to projects..."\n';
          for (const project of rec.affectedProjects) {
            scriptContent += `echo "Setting up tests for ${project}"\n`;
            scriptContent += `npx nx g @nx/jest:jest-project --project=${project} --setupFile=jest --skipFormat\n`;
          }
          break;

        case 'standardize-test-framework':
          scriptContent += '# Standardize test framework\n';
          scriptContent += 'echo "Standardizing test framework..."\n';
          scriptContent += '# TODO: Implement framework standardization\n';
          scriptContent += 'echo "Please choose Jest or Vitest and implement migration"\n';
          break;

        case 'improve-test-coverage':
          scriptContent += '# Improve test coverage\n';
          scriptContent += 'echo "Improving test coverage..."\n';
          scriptContent += '# TODO: Implement coverage improvements\n';
          scriptContent += 'echo "Please add tests for uncovered code paths"\n';
          break;

        default:
          scriptContent += '# Generic test fix script\n';
          scriptContent += 'echo "Please implement the specific test fix"\n';
      }

      fs.writeFileSync(scriptPath, scriptContent);
      fs.chmodSync(scriptPath, '755');
    }
  }

  console.log(`  📝 Created ${recommendations.filter(r => r.fixScript).length} test fix scripts`);
}

function generateTestFixReport(analysis, recommendations) {
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

function generateTestMarkdownReport(report) {
  const { analysis, recommendations, fixes } = report;

  let md = `# Nx Test Coverage Analysis Report\n\n`;
  md += `Generated: ${new Date().toLocaleString()}\n\n`;

  md += `## Summary\n\n`;
  md += `- **Total Projects**: ${analysis.totalProjects}\n`;
  md += `- **Projects with Tests**: ${analysis.projectsWithTests.length}\n`;
  md += `- **Projects without Tests**: ${analysis.projectsWithoutTests.length}\n`;
  md += `- **Test Coverage**: ${analysis.coverage.coveragePercentage}%\n`;
  md += `- **Recommendations**: ${recommendations.length}\n\n`;

  if (analysis.projectsWithoutTests.length > 0) {
    md += `## Projects Without Tests\n\n`;
    for (const project of analysis.projectsWithoutTests) {
      md += `### ${project.name} (${project.type})\n\n`;
      md += `**Reason:** ${project.reason}\n\n`;
      md += `**Location:** ${project.root}\n\n`;
    }
  }

  if (analysis.projectsWithTests.length > 0) {
    md += `## Projects With Tests\n\n`;
    md += `| Project | Type | Test Files | Coverage |\n`;
    md += `| ------- | ---- | ---------- | -------- |\n`;
    for (const project of analysis.projectsWithTests) {
      md += `| ${project.name} | ${project.type} | ${project.testFiles.length} | ${project.coverage} |\n`;
    }
    md += `\n`;
  }

  md += `## Coverage Statistics\n\n`;
  md += `- **Full Coverage**: ${analysis.coverage.fullCoverage} projects\n`;
  md += `- **Partial Coverage**: ${analysis.coverage.partialCoverage} projects\n`;
  md += `- **No Coverage**: ${analysis.coverage.noneCoverage} projects\n`;
  md += `- **Overall Coverage**: ${analysis.coverage.coveragePercentage}%\n\n`;

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
