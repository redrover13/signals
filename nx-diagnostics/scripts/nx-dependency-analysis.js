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

console.log('🔗 Nx Dependency Analysis Tool');
console.log('==============================');

try {
  // Get the project graph
  console.log('\n📊 Generating project graph...');
  const graphOutput = execSync('npx nx graph --file=temp-graph.json 2>/dev/null || echo "{}"', { encoding: 'utf8' });

  let graph = {};
  if (fs.existsSync('temp-graph.json')) {
    graph = JSON.parse(fs.readFileSync('temp-graph.json', 'utf8'));
  }

  // Analyze dependencies
  console.log('🔍 Analyzing dependencies...');
  const analysis = analyzeDependencies(graph);

  // Generate recommendations
  console.log('💡 Generating recommendations...');
  const recommendations = generateDependencyRecommendations(analysis);

  // Create fix scripts
  console.log('🔧 Creating fix scripts...');
  createFixScripts(analysis, recommendations);

  // Generate report
  const report = {
    timestamp,
    analysis,
    recommendations,
    fixes: generateFixReport(analysis, recommendations)
  };

  // Save report as JSON
  const jsonReportPath = path.join(outputDir, `nx-dependencies-${timestamp}.json`);
  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
  console.log(`✅ JSON report saved to: ${jsonReportPath}`);

  // Save report as Markdown
  const mdReportPath = path.join(outputDir, `nx-dependencies-${timestamp}.md`);
  fs.writeFileSync(mdReportPath, generateMarkdownReport(report));
  console.log(`✅ Markdown report saved to: ${mdReportPath}`);

  // Clean up temp file
  if (fs.existsSync('temp-graph.json')) {
    fs.unlinkSync('temp-graph.json');
  }

  console.log('\n✨ Dependency analysis completed!');
  console.log(`📊 Found ${analysis.circularDependencies.length} circular dependencies`);
  console.log(`🔗 Found ${analysis.missingDependencies.length} missing dependencies`);
  console.log(`📝 Generated ${recommendations.length} recommendations`);

} catch (error) {
  console.error('❌ Error during dependency analysis:', error);
  process.exit(1);
}

function analyzeDependencies(graph) {
  const nodes = graph.graph?.nodes || {};
  const dependencies = graph.graph?.dependencies || {};

  console.log(`  📁 Found ${Object.keys(nodes).length} projects`);

  // Find circular dependencies
  const circularDeps = findCircularDependencies(graph);
  console.log(`  🔄 Found ${circularDeps.length} circular dependencies`);

  // Find missing dependencies
  const missingDeps = findMissingDependencies(nodes, dependencies);
  console.log(`  ❓ Found ${missingDeps.length} missing dependencies`);

  // Analyze dependency patterns
  const patterns = analyzeDependencyPatterns(nodes, dependencies);
  console.log(`  📈 Analyzed dependency patterns`);

  return {
    totalProjects: Object.keys(nodes).length,
    circularDependencies: circularDeps,
    missingDependencies: missingDeps,
    dependencyPatterns: patterns,
    graph: graph
  };
}

function findCircularDependencies(graph) {
  const circularDeps = [];
  const nodes = graph.nodes || {};
  const dependencies = graph.dependencies || {};

  for (const [projectName, projectNode] of Object.entries(nodes)) {
    const visited = new Set();
    const path = [];
    const cycles = new Set();

    function dfs(current, startPath = []) {
      if (path.includes(current)) {
        // Found a cycle
        const cycleStart = path.indexOf(current);
        const cycle = path.slice(cycleStart).concat(current);

        // Avoid duplicate cycles
        const cycleKey = cycle.sort().join(',');
        if (!cycles.has(cycleKey)) {
          cycles.add(cycleKey);
          circularDeps.push({
            projects: cycle,
            cycle: cycle.join(' → '),
            severity: cycle.length > 3 ? 'high' : 'medium'
          });
        }
        return;
      }

      if (visited.has(current)) return;
      visited.add(current);
      path.push(current);

      const projectDeps = dependencies[current] || [];
      for (const dep of projectDeps) {
        if (dep.type === 'static' || dep.type === 'implicit') {
          dfs(dep.target, startPath);
        }
      }

      path.pop();
    }

    dfs(projectName);
  }

  return circularDeps;
}

function findMissingDependencies(nodes, dependencies) {
  const missingDeps = [];

  for (const [projectName, projectDeps] of Object.entries(dependencies)) {
    for (const dep of projectDeps) {
      if (dep.type === 'static' || dep.type === 'implicit') {
        if (!nodes[dep.target]) {
          missingDeps.push({
            from: projectName,
            to: dep.target,
            type: dep.type,
            severity: 'high'
          });
        }
      }
    }
  }

  return missingDeps;
}

function analyzeDependencyPatterns(nodes, dependencies) {
  const patterns = {
    mostDependedOn: [],
    leastDependedOn: [],
    dependencyChains: [],
    isolatedProjects: []
  };

  // Calculate dependency counts
  const dependencyCounts = {};
  const reverseDeps = {};

  for (const [projectName, projectDeps] of Object.entries(dependencies)) {
    dependencyCounts[projectName] = projectDeps.filter(d => d.type === 'static').length;

    for (const dep of projectDeps) {
      if (dep.type === 'static') {
        if (!reverseDeps[dep.target]) {
          reverseDeps[dep.target] = [];
        }
        reverseDeps[dep.target].push(projectName);
      }
    }
  }

  // Find most and least depended on projects
  const sortedByDeps = Object.entries(reverseDeps)
    .map(([project, deps]) => ({ project, count: deps.length }))
    .sort((a, b) => b.count - a.count);

  patterns.mostDependedOn = sortedByDeps.slice(0, 5);
  patterns.leastDependedOn = sortedByDeps.slice(-5).reverse();

  // Find isolated projects (no dependencies and not depended on)
  patterns.isolatedProjects = Object.keys(nodes).filter(project =>
    (!dependencies[project] || dependencies[project].length === 0) &&
    (!reverseDeps[project] || reverseDeps[project].length === 0)
  );

  return patterns;
}

function generateDependencyRecommendations(analysis) {
  const recommendations = [];

  // Handle circular dependencies
  if (analysis.circularDependencies.length > 0) {
    for (const cycle of analysis.circularDependencies) {
      recommendations.push({
        type: 'resolve-circular-dependency',
        priority: cycle.severity === 'high' ? 'high' : 'medium',
        title: `Resolve Circular Dependency: ${cycle.cycle}`,
        description: `Break the circular dependency between ${cycle.projects.join(', ')}`,
        actions: [
          'Extract shared code into a new utility library',
          'Invert the dependency direction',
          'Use dependency injection or event-driven patterns',
          'Consider using interfaces instead of concrete implementations'
        ],
        affectedProjects: cycle.projects,
        fixScript: `nx-diagnostics/scripts/fixes/fix-circular-${cycle.projects.join('-')}.sh`
      });
    }
  }

  // Handle missing dependencies
  if (analysis.missingDependencies.length > 0) {
    const groupedByTarget = {};
    for (const dep of analysis.missingDependencies) {
      if (!groupedByTarget[dep.to]) {
        groupedByTarget[dep.to] = [];
      }
      groupedByTarget[dep.to].push(dep.from);
    }

    for (const [target, sources] of Object.entries(groupedByTarget)) {
      recommendations.push({
        type: 'create-missing-project',
        priority: 'high',
        title: `Create Missing Project: ${target}`,
        description: `Project ${target} is referenced but does not exist. Referenced by: ${sources.join(', ')}`,
        actions: [
          `Create the missing project: npx nx g @nx/js:lib ${target}`,
          'Update project.json files to reference the correct project name',
          'Move existing code to the new project structure'
        ],
        affectedProjects: sources,
        fixScript: `nx-diagnostics/scripts/fixes/create-project-${target}.sh`
      });
    }
  }

  // Handle dependency patterns
  if (analysis.dependencyPatterns.mostDependedOn.length > 0) {
    const topDep = analysis.dependencyPatterns.mostDependedOn[0];
    if (topDep.count > 10) {
      recommendations.push({
        type: 'optimize-highly-depended-project',
        priority: 'medium',
        title: `Optimize Highly Depended Project: ${topDep.project}`,
        description: `${topDep.project} is depended on by ${topDep.count} projects. Consider optimizing its API.`,
        actions: [
          'Review the public API of this project',
          'Consider breaking it into smaller, more focused libraries',
          'Ensure proper versioning and backward compatibility',
          'Add comprehensive documentation'
        ],
        affectedProjects: [topDep.project]
      });
    }
  }

  // Handle isolated projects
  if (analysis.dependencyPatterns.isolatedProjects.length > 0) {
    recommendations.push({
      type: 'integrate-isolated-projects',
      priority: 'low',
      title: `Integrate Isolated Projects`,
      description: `${analysis.dependencyPatterns.isolatedProjects.length} projects have no dependencies. Consider integration opportunities.`,
      actions: [
        'Review if these projects should be integrated with others',
        'Consider if they represent reusable utilities that could be shared',
        'Evaluate if they should be removed if no longer needed'
      ],
      affectedProjects: analysis.dependencyPatterns.isolatedProjects
    });
  }

  return recommendations;
}

function createFixScripts(analysis, recommendations) {
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
        case 'resolve-circular-dependency':
          scriptContent += '# Resolve circular dependency\n';
          scriptContent += 'echo "Resolving circular dependency..."\n';
          scriptContent += '# TODO: Implement specific fix for this circular dependency\n';
          scriptContent += 'echo "Please implement the specific fix for this circular dependency"\n';
          break;

        case 'create-missing-project':
          scriptContent += '# Create missing project\n';
          scriptContent += `echo "Creating missing project: ${rec.title.split(': ')[1]}"\n`;
          scriptContent += `npx nx g @nx/js:lib ${rec.title.split(': ')[1]}\n`;
          break;

        default:
          scriptContent += '# Generic fix script\n';
          scriptContent += 'echo "Please implement the specific fix for this issue"\n';
      }

      fs.writeFileSync(scriptPath, scriptContent);
      fs.chmodSync(scriptPath, '755');
    }
  }

  console.log(`  📝 Created ${recommendations.filter(r => r.fixScript).length} fix scripts`);
}

function generateFixReport(analysis, recommendations) {
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

function generateMarkdownReport(report) {
  const { analysis, recommendations, fixes } = report;

  let md = `# Nx Dependency Analysis Report\n\n`;
  md += `Generated: ${new Date().toLocaleString()}\n\n`;

  md += `## Summary\n\n`;
  md += `- **Total Projects**: ${analysis.totalProjects}\n`;
  md += `- **Circular Dependencies**: ${analysis.circularDependencies.length}\n`;
  md += `- **Missing Dependencies**: ${analysis.missingDependencies.length}\n`;
  md += `- **Recommendations**: ${recommendations.length}\n\n`;

  if (analysis.circularDependencies.length > 0) {
    md += `## Circular Dependencies\n\n`;
    for (const dep of analysis.circularDependencies) {
      md += `### ${dep.cycle} (${dep.severity})\n\n`;
      md += `**Projects:** ${dep.projects.join(', ')}\n\n`;
    }
  }

  if (analysis.missingDependencies.length > 0) {
    md += `## Missing Dependencies\n\n`;
    for (const dep of analysis.missingDependencies) {
      md += `### ${dep.from} → ${dep.to} (${dep.severity})\n\n`;
      md += `**Type:** ${dep.type}\n\n`;
    }
  }

  if (analysis.dependencyPatterns.mostDependedOn.length > 0) {
    md += `## Dependency Patterns\n\n`;
    md += `### Most Depended On Projects\n\n`;
    md += `| Project | Dependencies |\n`;
    md += `| ------- | ------------ |\n`;
    for (const dep of analysis.dependencyPatterns.mostDependedOn) {
      md += `| ${dep.project} | ${dep.count} |\n`;
    }
    md += `\n`;
  }

  if (analysis.dependencyPatterns.isolatedProjects.length > 0) {
    md += `### Isolated Projects\n\n`;
    for (const project of analysis.dependencyPatterns.isolatedProjects) {
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
      if (rec.affectedProjects) {
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
