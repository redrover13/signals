#!/usr/bin/env node

/**
 * TypeScript Path Mapping Analysis Tool
 * 
 * This tool analyzes the path mappings in your TypeScript configuration files
 * to identify potential issues and optimization opportunities.
 */

const fs = require('fs');
const path = require('path');

// Read the base tsconfig file
function readTsConfig(configPath) {
  try {
    const tsConfigContent = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(tsConfigContent.replace(/\/\/.*$/gm, '').trim());
  } catch (error) {
    console.error(`Error reading tsconfig file at ${configPath}:`, error.message);
    process.exit(1);
  }
}

// Find all tsconfig files in the project
function findTsConfigFiles(startPath) {
  const results = [];
  
  function findRecursive(currentPath) {
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !filePath.includes('node_modules')) {
        findRecursive(filePath);
      } else if (file.match(/tsconfig.*\.json$/)) {
        results.push(filePath);
      }
    }
  }
  
  findRecursive(startPath);
  return results;
}

// Analyze path mappings for potential issues
function analyzePathMappings(tsConfig) {
  const issues = [];
  const pathMappings = tsConfig.compilerOptions?.paths || {};
  
  // Check for wildcard paths that might overlap
  const wildcardPaths = Object.keys(pathMappings).filter(p => p.includes('*'));
  for (let i = 0; i < wildcardPaths.length; i++) {
    for (let j = i + 1; j < wildcardPaths.length; j++) {
      const path1 = wildcardPaths[i].replace('*', '');
      const path2 = wildcardPaths[j].replace('*', '');
      
      if (path1.startsWith(path2) || path2.startsWith(path1)) {
        issues.push({
          type: 'Potential Path Overlap',
          paths: [wildcardPaths[i], wildcardPaths[j]],
          description: 'These wildcard paths may overlap, causing ambiguous module resolution'
        });
      }
    }
  }
  
  // Check for paths that resolve to the same location
  const pathTargets = {};
  for (const [pathPattern, targets] of Object.entries(pathMappings)) {
    if (targets && targets.length > 0) {
      const targetStr = JSON.stringify(targets);
      pathTargets[targetStr] = pathTargets[targetStr] || [];
      pathTargets[targetStr].push(pathPattern);
    }
  }
  
  for (const [targetStr, paths] of Object.entries(pathTargets)) {
    if (paths.length > 1) {
      issues.push({
        type: 'Duplicate Path Target',
        paths,
        targets: JSON.parse(targetStr),
        description: 'Multiple path patterns resolve to the same target(s)'
      });
    }
  }
  
  // Check for potentially unused path mappings
  // This would require code analysis which is more complex
  
  return issues;
}

// Main function
function main() {
  const rootDir = process.cwd();
  const baseTsConfigPath = path.join(rootDir, 'tsconfig.base.json');
  
  console.log('🔍 TypeScript Path Mappings Analysis');
  console.log('====================================\n');
  
  // Analyze the base tsconfig
  if (fs.existsSync(baseTsConfigPath)) {
    console.log(`Analyzing base configuration: ${baseTsConfigPath}`);
    const baseTsConfig = readTsConfig(baseTsConfigPath);
    const baseIssues = analyzePathMappings(baseTsConfig);
    
    if (baseIssues.length > 0) {
      console.log('\n🚨 Issues in base tsconfig.json:');
      baseIssues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.type}`);
        console.log(`   Paths: ${issue.paths.join(', ')}`);
        if (issue.targets) {
          console.log(`   Targets: ${issue.targets.join(', ')}`);
        }
        console.log(`   Description: ${issue.description}`);
      });
    } else {
      console.log('\n✅ No issues found in base tsconfig.json');
    }
    
    // Print all path mappings
    const pathMappings = baseTsConfig.compilerOptions?.paths || {};
    console.log('\n📋 Current Path Mappings:');
    Object.entries(pathMappings).forEach(([pattern, targets]) => {
      console.log(`   "${pattern}": ${JSON.stringify(targets)}`);
    });
  } else {
    console.log('⚠️ No tsconfig.base.json found');
  }
  
  // Find and analyze other tsconfig files
  const allTsConfigFiles = findTsConfigFiles(rootDir)
    .filter(file => file !== baseTsConfigPath);
  
  if (allTsConfigFiles.length > 0) {
    console.log('\n🔍 Analyzing other tsconfig files in the project:');
    
    let totalIssuesCount = 0;
    
    allTsConfigFiles.forEach(configPath => {
      const relativePath = path.relative(rootDir, configPath);
      console.log(`\nAnalyzing: ${relativePath}`);
      
      const tsConfig = readTsConfig(configPath);
      
      // Check if it extends the base config
      if (tsConfig.extends) {
        console.log(`   Extends: ${tsConfig.extends}`);
      } else if (configPath !== baseTsConfigPath) {
        console.log('   ⚠️ Does not extend any base configuration');
      }
      
      // Only analyze if it has its own paths
      if (tsConfig.compilerOptions?.paths) {
        const issues = analyzePathMappings(tsConfig);
        totalIssuesCount += issues.length;
        
        if (issues.length > 0) {
          console.log(`   🚨 Found ${issues.length} issues`);
          issues.forEach((issue, index) => {
            console.log(`     ${index + 1}. ${issue.type}: ${issue.paths.join(', ')}`);
          });
        } else {
          console.log('   ✅ No path mapping issues found');
        }
      } else {
        console.log('   ℹ️ No custom path mappings defined');
      }
    });
    
    console.log(`\n📊 Summary: Analyzed ${allTsConfigFiles.length} additional tsconfig files with ${totalIssuesCount} total issues.`);
  } else {
    console.log('\nNo additional tsconfig files found.');
  }
  
  console.log('\n✨ Analysis Complete!');
  console.log('Recommendations:');
  console.log('1. Resolve any path overlap issues by consolidating or refining path patterns');
  console.log('2. Remove duplicate path mappings that point to the same targets');
  console.log('3. Consider standardizing your path mapping approach across the codebase');
  console.log('4. Review all tsconfig files to ensure they extend the base configuration');
}

main();
