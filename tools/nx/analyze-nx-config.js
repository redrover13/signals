#!/usr/bin/env node

/**
 * Nx Configuration Analysis Tool
 * 
 * This tool analyzes your Nx workspace configuration to identify issues,
 * inefficiencies, and opportunities for optimization.
 */

const fs = require('fs');
const path = require('path');

// Read JSON file with comments support
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Remove comments (both // and /* */) before parsing
    const jsonContent = content
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error(`Error reading file at ${filePath}:`, error.message);
    return null;
  }
}

// Find all project.json files
function findProjectFiles(startPath) {
  const results = [];
  
  function findRecursive(currentPath) {
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !filePath.includes('node_modules')) {
        findRecursive(filePath);
      } else if (file === 'project.json') {
        results.push(filePath);
      }
    }
  }
  
  findRecursive(startPath);
  return results;
}

// Analyze nx.json for issues
function analyzeNxConfig(nxConfig) {
  const issues = [];
  
  // Check if cacheable operations are defined
  if (!nxConfig.targetDefaults) {
    issues.push({
      type: 'Missing Target Defaults',
      description: 'No targetDefaults configuration found. This can lead to inconsistent build settings across projects.'
    });
  } else {
    // Check for common targets
    const commonTargets = ['build', 'test', 'lint', 'e2e'];
    for (const target of commonTargets) {
      if (!nxConfig.targetDefaults[target]) {
        issues.push({
          type: 'Missing Common Target',
          target,
          description: `The ${target} target is not defined in targetDefaults. Consider adding it for consistency.`
        });
      }
    }
    
    // Check caching configuration
    for (const [target, config] of Object.entries(nxConfig.targetDefaults)) {
      if (!config.cache) {
        issues.push({
          type: 'Caching Not Configured',
          target,
          description: `Caching is not explicitly configured for the ${target} target. Consider enabling it to improve performance.`
        });
      }
    }
  }
  
  // Check generators config
  if (!nxConfig.generators) {
    issues.push({
      type: 'Missing Generators Config',
      description: 'No generators configuration found. Consider adding default generator presets for consistency.'
    });
  }
  
  // Check for proper NPM scope
  if (!nxConfig.npmScope) {
    issues.push({
      type: 'Missing NPM Scope',
      description: 'No npmScope defined. This helps with import path generation and organization.'
    });
  }
  
  // Check tasks runner
  if (!nxConfig.tasksRunnerOptions) {
    issues.push({
      type: 'Missing Tasks Runner',
      description: 'No tasksRunnerOptions defined. This affects how tasks are executed and cached.'
    });
  } else {
    const defaultRunner = nxConfig.tasksRunnerOptions.default;
    if (!defaultRunner) {
      issues.push({
        type: 'Missing Default Tasks Runner',
        description: 'No default tasks runner configured.'
      });
    } else if (defaultRunner.options) {
      // Check for cacheableOperations
      if (!defaultRunner.options.cacheableOperations || defaultRunner.options.cacheableOperations.length === 0) {
        issues.push({
          type: 'No Cacheable Operations',
          description: 'No cacheable operations defined. Caching can significantly improve build performance.'
        });
      }
    }
  }
  
  return issues;
}

// Analyze all project.json files for consistency and issues
function analyzeProjects(projectFiles, nxConfig) {
  const issues = [];
  const projects = {};
  
  // Load all projects
  for (const filePath of projectFiles) {
    const projectJson = readJsonFile(filePath);
    if (projectJson) {
      const projectDir = path.dirname(filePath);
      const projectName = path.basename(path.dirname(filePath));
      projects[projectName] = { config: projectJson, path: projectDir };
    }
  }
  
  // Check for naming consistency
  const projectNames = Object.keys(projects);
  
  // Check for naming patterns (e.g., libs should follow a domain/feature pattern)
  const libProjects = projectNames.filter(name => projects[name].path.includes('/libs/'));
  const appProjects = projectNames.filter(name => projects[name].path.includes('/apps/'));
  
  // Check libs naming convention
  for (const libName of libProjects) {
    if (!libName.includes('-') && !libName.includes('/')) {
      issues.push({
        type: 'Library Naming Convention',
        project: libName,
        description: 'Library name does not follow domain/feature or domain-feature pattern. Consider adopting a consistent naming convention.'
      });
    }
  }
  
  // Check for consistent target definitions
  const targetTypes = new Set();
  for (const { config } of Object.values(projects)) {
    if (config.targets) {
      Object.keys(config.targets).forEach(target => targetTypes.add(target));
    }
  }
  
  // Check that all projects have the common targets
  for (const projectName of projectNames) {
    const { config } = projects[projectName];
    const projectTargets = config.targets ? Object.keys(config.targets) : [];
    
    for (const commonTarget of ['build', 'test', 'lint']) {
      if (!projectTargets.includes(commonTarget)) {
        issues.push({
          type: 'Missing Common Target',
          project: projectName,
          target: commonTarget,
          description: `Project '${projectName}' does not have a ${commonTarget} target.`
        });
      }
    }
  }
  
  return issues;
}

// Main function
function main() {
  const rootDir = process.cwd();
  const nxJsonPath = path.join(rootDir, 'nx.json');
  
  console.log('🔍 Nx Workspace Configuration Analysis');
  console.log('======================================\n');
  
  if (!fs.existsSync(nxJsonPath)) {
    console.error('❌ nx.json not found. Are you in an Nx workspace?');
    process.exit(1);
  }
  
  console.log(`Analyzing Nx configuration: ${nxJsonPath}`);
  const nxConfig = readJsonFile(nxJsonPath);
  
  if (!nxConfig) {
    console.error('❌ Failed to parse nx.json. Check for syntax errors.');
    process.exit(1);
  }
  
  // Analyze nx.json
  const nxIssues = analyzeNxConfig(nxConfig);
  
  if (nxIssues.length > 0) {
    console.log('\n🚨 Issues in nx.json:');
    nxIssues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.type}`);
      if (issue.target) {
        console.log(`   Target: ${issue.target}`);
      }
      console.log(`   Description: ${issue.description}`);
    });
  } else {
    console.log('\n✅ No issues found in nx.json');
  }
  
  // Find and analyze project.json files
  console.log('\n🔍 Analyzing project configurations...');
  const projectFiles = findProjectFiles(rootDir);
  console.log(`Found ${projectFiles.length} project.json files`);
  
  if (projectFiles.length > 0) {
    const projectIssues = analyzeProjects(projectFiles, nxConfig);
    
    if (projectIssues.length > 0) {
      console.log('\n🚨 Issues in project configurations:');
      projectIssues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.type}`);
        console.log(`   Project: ${issue.project}`);
        if (issue.target) {
          console.log(`   Target: ${issue.target}`);
        }
        console.log(`   Description: ${issue.description}`);
      });
    } else {
      console.log('\n✅ No issues found in project configurations');
    }
  }
  
  // Check for workspace structure best practices
  console.log('\n📋 Nx Workspace Structure:');
  const hasAppsDir = fs.existsSync(path.join(rootDir, 'apps'));
  const hasLibsDir = fs.existsSync(path.join(rootDir, 'libs'));
  
  if (hasAppsDir) {
    console.log('✅ apps/ directory exists');
  } else {
    console.log('⚠️ apps/ directory not found');
  }
  
  if (hasLibsDir) {
    console.log('✅ libs/ directory exists');
  } else {
    console.log('⚠️ libs/ directory not found');
  }
  
  // Summary and recommendations
  console.log('\n✨ Analysis Complete!');
  
  if (nxIssues.length > 0 || (projectFiles.length > 0 && projectIssues?.length > 0)) {
    console.log(`Found ${nxIssues.length} issues in nx.json and ${projectIssues?.length || 0} issues in project configurations.`);
  } else {
    console.log('No significant issues found in the Nx configuration.');
  }
  
  console.log('\nRecommendations:');
  console.log('1. Ensure consistent target definitions across all projects');
  console.log('2. Configure caching for all appropriate targets to improve build performance');
  console.log('3. Follow consistent naming conventions for libraries (domain/feature pattern)');
  console.log('4. Configure task runners properly for optimized performance');
  console.log('5. Consider using Nx Cloud for enhanced caching and distributed task execution');
}

main();
