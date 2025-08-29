/**
 * @fileoverview analyze-dependencies module for the scripts component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * This script analyzes dependencies across the workspace to identify
 * circular dependencies and suggest improvements.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface Project {
  name: string;
  path: string;
  dependencies: string[];
}

interface DependencyIssue {
  type: 'circular' | 'missing-implicit' | 'unused-implicit';
  projects: string[];
  message: string;
}

const analyzeDependencies = (): void => {
  try {
    // Find all project.json files
    const projectFiles = glob.sync('**/project.json', {
      ignore: ['node_modules/**', 'dist/**', 'tools/**']
    });
    
    console.log(`Found ${projectFiles.length} projects to analyze`);
    
    const projects: Project[] = [];
    const projectMap: Record<string, Project> = {};
    
    // Parse projects and their dependencies
    projectFiles.forEach(projectPath => {
      try {
        const fullPath = path.resolve(projectPath);
        const config = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        
        const projectName = config.name;
        if (!projectName) {
          console.log(`Skipping ${projectPath}: No project name found`);
          return;
        }
        
        // Extract dependencies from imports
        const sourceRoot = config.sourceRoot || path.join(path.dirname(projectPath), 'src');
        const dependencies: string[] = [];
        
        // Find TypeScript files in the project
        const tsFiles = glob.sync(`${sourceRoot}/**/*.ts`, {
          ignore: ['**/*.spec.ts', '**/*.test.ts']
        });
        
        // Extract imports from files
        tsFiles.forEach(filePath => {
          const content = fs.readFileSync(filePath, 'utf8');
          const importRegex = /from ['"](@[^'"]+)['"]/g;
          let match;
          
          while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1].split('/')[1]; // Extract project name from @org/project
            if (importPath && !dependencies.includes(importPath)) {
              dependencies.push(importPath);
            }
          }
        });
        
        const project: Project = {
          name: projectName,
          path: projectPath,
          dependencies
        };
        
        projects.push(project);
        projectMap[projectName] = project;
      } catch (err) {
        console.error(`Error analyzing ${projectPath}:`, err);
      }
    });
    
    // Analyze for issues
    const issues: DependencyIssue[] = [];
    
    // Check for circular dependencies
    projects.forEach(project => {
      const visited = new Set<string>();
      const path: string[] = [];
      
      const dfs = (currentProject: string): boolean => {
        if (path.includes(currentProject)) {
          const cycle = [...path.slice(path.indexOf(currentProject)), currentProject];
          issues.push({
            type: 'circular',
            projects: cycle,
            message: `Circular dependency detected: ${cycle.join(' -> ')}`
          });
          return true;
        }
        
        if (visited.has(currentProject)) {
          return false;
        }
        
        visited.add(currentProject);
        path.push(currentProject);
        
        const proj = projectMap[currentProject];
        if (!proj) {
          path.pop();
          return false;
        }
        
        for (const dep of proj.dependencies) {
          if (dfs(dep)) {
            return true;
          }
        }
        
        path.pop();
        return false;
      };
      
      dfs(project.name);
    });
    
    // Check for implicit dependencies
    projects.forEach(project => {
      const config = JSON.parse(fs.readFileSync(path.resolve(project.path), 'utf8'));
      const implicitDeps = config.implicitDependencies || [];
      
      // Check for missing implicit dependencies
      project.dependencies.forEach(dep => {
        const depProject = projectMap[dep];
        if (!depProject) return;
        
        // If we depend on project X and X depends on Y implicitly, we should depend on Y implicitly too
        const depImplicitDeps = JSON.parse(fs.readFileSync(path.resolve(depProject.path), 'utf8')).implicitDependencies || [];
        depImplicitDeps.forEach((implicitDep: string) => {
          if (!implicitDeps.includes(implicitDep) && !project.dependencies.includes(implicitDep)) {
            issues.push({
              type: 'missing-implicit',
              projects: [project.name, dep, implicitDep],
              message: `${project.name} depends on ${dep}, which implicitly depends on ${implicitDep}, but ${project.name} doesn't have ${implicitDep} as an implicit dependency`
            });
          }
        });
      });
      
      // Check for unused implicit dependencies
      implicitDeps.forEach((implicitDep: string) => {
        const isUsed = projects.some(p => 
          p.name === implicitDep || 
          p.dependencies.includes(implicitDep) || 
          (projectMap[implicitDep] && projectMap[implicitDep].dependencies.includes(p.name))
        );
        
        if (!isUsed) {
          issues.push({
            type: 'unused-implicit',
            projects: [project.name, implicitDep],
            message: `${project.name} has ${implicitDep} as an implicit dependency, but it doesn't seem to be used`
          });
        }
      });
    });
    
    // Generate report
    if (issues.length > 0) {
      console.log('Dependency issues found:');
      issues.forEach(issue => {
        console.log(`${issue.type.toUpperCase()}: ${issue.message}`);
      });
      
      // Write report to file
      const reportPath = path.resolve('dependency-issues.json');
      fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2));
      console.log(`Report written to ${reportPath}`);
    } else {
      console.log('No dependency issues found!');
    }
  } catch (err) {
    console.error('Failed to analyze dependencies:', err);
  }
};

analyzeDependencies();
