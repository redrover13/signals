/**
 * Script to analyze imports and project references
 * This script checks for imports between projects and ensures that project references are correctly set up
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import glob from 'glob';

// Define the root directory of the project
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Function to extract imports from a TypeScript file
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importRegex = /import\s+(?:(?:[{}\s\w*,]+)\s+from\s+)?['"]([^'"]+)['"]/g;
  const imports = [];
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

// Function to map package name to project directory
function mapPackageToProject(packageName) {
  // Read the tsconfig.base.json to get the path mappings
  const tsconfigPath = path.join(rootDir, 'tsconfig.base.json');
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  const paths = tsconfig.compilerOptions.paths || {};
  
  for (const [alias, aliasPath] of Object.entries(paths)) {
    if (packageName === alias || packageName.startsWith(alias + '/')) {
      // Extract the project directory from the path mapping
      const projectPath = aliasPath[0].replace('/src/index.ts', '');
      return projectPath;
    }
  }
  
  return null;
}

// Function to check if a project has a reference to another project
function hasProjectReference(projectDir, referenceDir) {
  const tsconfigPath = path.join(rootDir, projectDir, 'tsconfig.json');
  
  if (!fs.existsSync(tsconfigPath)) {
    return false;
  }
  
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  const references = tsconfig.references || [];
  
  for (const reference of references) {
    const refPath = reference.path;
    const absoluteRefPath = path.resolve(path.join(rootDir, projectDir), refPath);
    
    // Check if the reference points to the target project
    if (absoluteRefPath.includes(referenceDir)) {
      return true;
    }
  }
  
  return false;
}

// Main function to analyze imports and project references
function analyzeProjectReferences() {
  // Find all TypeScript files in the project
  const files = glob.sync(path.join(rootDir, 'libs/**/*.ts'), { ignore: ['**/node_modules/**', '**/*.d.ts'] });
  
  const projectDependencies = {};
  
  // Extract imports from each file and map them to projects
  for (const file of files) {
    const relativeFilePath = path.relative(rootDir, file);
    const projectDir = relativeFilePath.split(path.sep)[0] + '/' + relativeFilePath.split(path.sep)[1];
    
    if (!projectDependencies[projectDir]) {
      projectDependencies[projectDir] = new Set();
    }
    
    const imports = extractImports(file);
    
    for (const importPath of imports) {
      // Skip relative imports and node_modules imports
      if (importPath.startsWith('.') || !importPath.startsWith('@')) {
        continue;
      }
      
      const dependencyProject = mapPackageToProject(importPath);
      
      if (dependencyProject && dependencyProject !== projectDir) {
        projectDependencies[projectDir].add(dependencyProject);
      }
    }
  }
  
  // Check if project references are correctly set up
  const missingReferences = [];
  
  for (const [projectDir, dependencies] of Object.entries(projectDependencies)) {
    for (const dependency of dependencies) {
      if (!hasProjectReference(projectDir, dependency)) {
        missingReferences.push({ from: projectDir, to: dependency });
      }
    }
  }
  
  return {
    projectDependencies,
    missingReferences
  };
}

// Run the analysis
const result = analyzeProjectReferences();
console.log('Project Dependencies:', JSON.stringify(result.projectDependencies, null, 2));
console.log('Missing References:', JSON.stringify(result.missingReferences, null, 2));
