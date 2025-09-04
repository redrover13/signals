#!/usr/bin/env node

/**
 * TypeScript Configuration Template Applier
 * 
 * This script applies the standardized TypeScript configuration template
 * to a specified project or all projects in the workspace.
 * 
 * Usage:
 *   node apply-tsconfig-template.js --project=your-project-name
 *   node apply-tsconfig-template.js --all
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
let projectName = null;
let applyToAll = false;

for (const arg of args) {
  if (arg.startsWith('--project=')) {
    projectName = arg.replace('--project=', '');
  } else if (arg === '--all') {
    applyToAll = true;
  }
}

// Validate arguments
if (!projectName && !applyToAll) {
  console.error('Error: Please specify a project name (--project=your-project-name) or use --all to apply to all projects.');
  process.exit(1);
}

// Find all projects with tsconfig.json files
function findProjects(startPath) {
  const projects = [];
  
  function findRecursive(currentPath) {
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !filePath.includes('node_modules')) {
        if (fs.existsSync(path.join(filePath, 'tsconfig.json'))) {
          projects.push({
            name: path.basename(filePath),
            path: filePath
          });
        }
        findRecursive(filePath);
      }
    }
  }
  
  findRecursive(startPath);
  return projects;
}

// Apply template to a project
function applyTemplate(projectPath, projectName) {
  const templatePath = path.join(process.cwd(), 'tools', 'typescript', 'tsconfig.lib.template.json');
  
  if (!fs.existsSync(templatePath)) {
    console.error(`Error: Template file not found at ${templatePath}`);
    return false;
  }
  
  const tsConfigPath = path.join(projectPath, 'tsconfig.json');
  
  if (!fs.existsSync(tsConfigPath)) {
    console.error(`Error: tsconfig.json not found for project at ${projectPath}`);
    return false;
  }
  
  try {
    // Read template and existing config
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const template = JSON.parse(templateContent);
    
    const existingContent = fs.readFileSync(tsConfigPath, 'utf8');
    const existing = JSON.parse(existingContent.replace(/\/\/.*$/gm, '').trim());
    
    // Create backup
    const backupPath = `${tsConfigPath}.bak`;
    fs.writeFileSync(backupPath, existingContent);
    
    // Merge configurations, prioritizing template settings
    const merged = {
      ...existing,
      compilerOptions: {
        ...existing.compilerOptions,
        ...template.compilerOptions
      }
    };
    
    // Keep existing include, exclude, files settings if they exist
    if (existing.include) merged.include = existing.include;
    if (existing.exclude) merged.exclude = existing.exclude;
    if (existing.files) merged.files = existing.files;
    
    // Write merged configuration
    fs.writeFileSync(tsConfigPath, JSON.stringify(merged, null, 2));
    
    console.log(`✅ Applied template to ${projectName} (${projectPath})`);
    console.log(`   Backup created at ${backupPath}`);
    return true;
  } catch (error) {
    console.error(`Error applying template to ${projectName}:`, error.message);
    return false;
  }
}

// Main function
function main() {
  const rootDir = process.cwd();
  console.log('🔧 TypeScript Configuration Template Applier');
  console.log('============================================\n');
  
  if (!fs.existsSync(path.join(rootDir, 'tools', 'typescript', 'tsconfig.lib.template.json'))) {
    console.error('Error: Template file not found. Make sure tools/typescript/tsconfig.lib.template.json exists.');
    process.exit(1);
  }
  
  if (projectName) {
    // Apply to specific project
    const projects = findProjects(rootDir);
    const project = projects.find(p => p.name === projectName);
    
    if (!project) {
      console.error(`Error: Project '${projectName}' not found.`);
      console.log('Available projects:');
      projects.forEach(p => console.log(`- ${p.name}`));
      process.exit(1);
    }
    
    const success = applyTemplate(project.path, project.name);
    
    if (!success) {
      process.exit(1);
    }
  } else if (applyToAll) {
    // Apply to all projects
    const projects = findProjects(rootDir);
    console.log(`Found ${projects.length} projects with tsconfig.json files.`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const project of projects) {
      const success = applyTemplate(project.path, project.name);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    console.log(`\n📊 Summary: Applied template to ${successCount} projects, ${failCount} failures.`);
  }
  
  console.log('\n✨ Done!');
}

main();
