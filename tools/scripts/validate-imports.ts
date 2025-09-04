#!/usr/bin/env tsx
/**
 * @fileoverview Import validation script
 * 
 * This script validates all import paths in the codebase to ensure they point to existing modules
 * and are correctly mapped in tsconfig.json
 * 
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { glob } from 'glob';
import chalk from 'chalk';

interface ImportIssue {
  file: string;
  line: number;
  importPath: string;
  issue: string;
  severity: 'error' | 'warning';
}

interface ValidationResult {
  totalFiles: number;
  totalImports: number;
  issues: ImportIssue[];
  success: boolean;
}

class ImportValidator {
  private projectRoot: string;
  private tsConfigPaths: Record<string, string[]>;
  private issues: ImportIssue[] = [];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.tsConfigPaths = this.loadTsConfigPaths();
  }

  private loadTsConfigPaths(): Record<string, string[]> {
    try {
      const tsConfigPath = join(this.projectRoot, 'tsconfig.base.json');
      const tsConfig = JSON.parse(readFileSync(tsConfigPath, 'utf-8'));
      return tsConfig.compilerOptions?.paths || {};
    } catch (error) {
      console.error(chalk.red('Failed to load tsconfig.base.json:'), error);
      return {};
    }
  }

  private resolveImportPath(importPath: string, fromFile: string): string | null {
    // Handle relative imports
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const resolvedPath = resolve(dirname(fromFile), importPath);
      
      // Check for .ts, .tsx, .js, .jsx extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
      for (const ext of extensions) {
        if (existsSync(resolvedPath + ext)) {
          return resolvedPath + ext;
        }
      }
      return null;
    }

    // Handle path mappings from tsconfig
    for (const [pattern, paths] of Object.entries(this.tsConfigPaths)) {
      if (pattern.endsWith('/*')) {
        const basePattern = pattern.slice(0, -2);
        if (importPath.startsWith(basePattern)) {
          const suffix = importPath.slice(basePattern.length);
          for (const mappedPath of paths) {
            const resolvedPath = join(
              this.projectRoot,
              mappedPath.replace('*', suffix).replace(/^\.\//, '')
            );
            
            if (existsSync(resolvedPath)) {
              return resolvedPath;
            }
            
            // Try with extensions
            const extensions = ['.ts', '.tsx', '.js', '.jsx'];
            for (const ext of extensions) {
              if (existsSync(resolvedPath + ext)) {
                return resolvedPath + ext;
              }
            }
          }
        }
      } else if (importPath === pattern) {
        for (const mappedPath of paths) {
          const resolvedPath = join(this.projectRoot, mappedPath);
          if (existsSync(resolvedPath)) {
            return resolvedPath;
          }
        }
      }
    }

    // Handle node_modules imports (assume they exist if in package.json)
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      // This is a node_modules import - we'll assume it's valid for now
      // In a more comprehensive check, we'd verify against package.json
      return 'node_modules';
    }

    return null;
  }

  private extractImports(content: string): Array<{ importPath: string; line: number }> {
    const imports: Array<{ importPath: string; line: number }> = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Match ES6 imports
      const importMatch = line.match(/import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/);
      if (importMatch) {
        imports.push({
          importPath: importMatch[1],
          line: i + 1
        });
        continue;
      }

      // Match dynamic imports
      const dynamicImportMatch = line.match(/import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/);
      if (dynamicImportMatch) {
        imports.push({
          importPath: dynamicImportMatch[1],
          line: i + 1
        });
        continue;
      }

      // Match require statements (for CommonJS detection)
      const requireMatch = line.match(/require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/);
      if (requireMatch) {
        imports.push({
          importPath: requireMatch[1],
          line: i + 1
        });
      }
    }

    return imports;
  }

  private validateFile(filePath: string): void {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const imports = this.extractImports(content);

      for (const { importPath, line } of imports) {
        // Skip certain imports that are known to be valid
        if (this.shouldSkipImport(importPath)) {
          continue;
        }

        const resolvedPath = this.resolveImportPath(importPath, filePath);
        
        if (!resolvedPath) {
          this.issues.push({
            file: filePath,
            line,
            importPath,
            issue: 'Import path cannot be resolved',
            severity: 'error'
          });
        } else if (resolvedPath === 'node_modules') {
          // Node modules import - could validate against package.json
          continue;
        }

        // Check for CommonJS usage
        if (content.includes(`require('${importPath}')`) || content.includes(`require("${importPath}")`)) {
          this.issues.push({
            file: filePath,
            line,
            importPath,
            issue: 'CommonJS require() detected - should use ESM import',
            severity: 'warning'
          });
        }
      }

      // Check for module.exports usage
      if (content.includes('module.exports')) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('module.exports')) {
            this.issues.push({
              file: filePath,
              line: i + 1,
              importPath: '',
              issue: 'CommonJS module.exports detected - should use ESM export',
              severity: 'warning'
            });
          }
        }
      }
    } catch (error) {
      this.issues.push({
        file: filePath,
        line: 0,
        importPath: '',
        issue: `Failed to read file: ${error}`,
        severity: 'error'
      });
    }
  }

  private shouldSkipImport(importPath: string): boolean {
    // Skip built-in Node.js modules
    const builtinModules = [
      'fs', 'path', 'crypto', 'http', 'https', 'url', 'util', 'events',
      'stream', 'buffer', 'os', 'child_process', 'cluster', 'worker_threads'
    ];

    if (builtinModules.includes(importPath)) {
      return true;
    }

    // Skip common external libraries that we know exist
    const knownLibraries = [
      'react', 'react-dom', 'fastify', 'axios', 'lodash-es', 'uuid',
      'chalk', 'glob', 'zod', 'jest', 'vitest', '@testing-library/react'
    ];

    return knownLibraries.some(lib => importPath.startsWith(lib));
  }

  public async validate(): Promise<ValidationResult> {
    console.log(chalk.blue('🔍 Validating imports across the codebase...'));

    // Find all TypeScript and JavaScript files
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      cwd: this.projectRoot,
      ignore: [
        'node_modules/**',
        'dist/**',
        'build/**',
        'coverage/**',
        '.nx/**',
        '**/*.d.ts'
      ]
    });

    console.log(chalk.gray(`Found ${files.length} files to validate`));

    let totalImports = 0;
    for (const file of files) {
      const fullPath = join(this.projectRoot, file);
      this.validateFile(fullPath);
      
      // Count imports for statistics
      try {
        const content = readFileSync(fullPath, 'utf-8');
        totalImports += this.extractImports(content).length;
      } catch {
        // Ignore files we can't read
      }
    }

    const success = this.issues.filter(issue => issue.severity === 'error').length === 0;

    return {
      totalFiles: files.length,
      totalImports,
      issues: this.issues,
      success
    };
  }

  public printResults(result: ValidationResult): void {
    console.log('\n' + chalk.bold('📊 Import Validation Results'));
    console.log(chalk.gray('─'.repeat(50)));
    
    console.log(`Files scanned: ${chalk.cyan(result.totalFiles)}`);
    console.log(`Imports checked: ${chalk.cyan(result.totalImports)}`);
    
    const errors = result.issues.filter(issue => issue.severity === 'error');
    const warnings = result.issues.filter(issue => issue.severity === 'warning');
    
    console.log(`Errors: ${chalk.red(errors.length)}`);
    console.log(`Warnings: ${chalk.yellow(warnings.length)}`);

    if (result.issues.length === 0) {
      console.log('\n' + chalk.green('✅ All imports are valid!'));
      return;
    }

    // Group issues by file
    const issuesByFile = result.issues.reduce((acc, issue) => {
      if (!acc[issue.file]) {
        acc[issue.file] = [];
      }
      acc[issue.file].push(issue);
      return acc;
    }, {} as Record<string, ImportIssue[]>);

    console.log('\n' + chalk.bold('🚨 Issues Found:'));
    
    for (const [file, issues] of Object.entries(issuesByFile)) {
      console.log(`\n${chalk.cyan(file.replace(this.projectRoot, '.'))}`);
      
      for (const issue of issues) {
        const severity = issue.severity === 'error' ? chalk.red('ERROR') : chalk.yellow('WARN');
        const line = issue.line > 0 ? `:${issue.line}` : '';
        const importPath = issue.importPath ? ` "${issue.importPath}"` : '';
        
        console.log(`  ${severity}${line}${importPath} - ${issue.issue}`);
      }
    }

    if (!result.success) {
      console.log('\n' + chalk.red('❌ Import validation failed'));
      process.exit(1);
    } else {
      console.log('\n' + chalk.yellow('⚠️  Import validation completed with warnings'));
    }
  }
}

// Main execution
async function main() {
  const projectRoot = process.cwd();
  const validator = new ImportValidator(projectRoot);
  
  try {
    const result = await validator.validate();
    validator.printResults(result);
  } catch (error) {
    console.error(chalk.red('Failed to validate imports:'), error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ImportValidator };