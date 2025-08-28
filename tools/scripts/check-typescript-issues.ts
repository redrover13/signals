/**
 * @fileoverview check-typescript-issues module for the scripts component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * This script checks for TypeScript issues across the workspace
 * and generates a report of problems found.
 */
import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import * as glob from 'glob';

interface TypeScriptIssue {
  filePath: string;
  line: number;
  character: number;
  code: number;
  message: string;
  severity: 'error' | 'warning';
}

const checkTypeScriptIssues = (): void => {
  try {
    // Get the TypeScript configuration
    const configPath = path.resolve('tsconfig.base.json');
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    
    if (configFile.error) {
      throw new Error(`Error reading tsconfig: ${configFile.error.messageText}`);
    }
    
    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(configPath)
    );
    
    if (parsedConfig.errors.length) {
      throw new Error(`Error parsing tsconfig: ${parsedConfig.errors[0].messageText}`);
    }
    
    // Find all TypeScript files
    const tsFiles = glob.sync('**/*.ts', {
      ignore: ['node_modules/**', 'dist/**', '**/*.d.ts', '**/*.spec.ts', '**/*.test.ts']
    });
    
    console.log(`Found ${tsFiles.length} TypeScript files to check`);
    
    // Create a program
    const program = ts.createProgram(tsFiles, parsedConfig.options);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    
    // Collect issues
    const issues: TypeScriptIssue[] = diagnostics.map(diagnostic => {
      let filePath = 'Unknown file';
      let line = 0;
      let character = 0;
      
      if (diagnostic.file) {
        filePath = diagnostic.file.fileName;
        const { line: lineNum, character: charNum } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
        line = lineNum + 1; // Lines are 0-based
        character = charNum + 1; // Characters are 0-based
      }
      
      return {
        filePath,
        line,
        character,
        code: diagnostic.code,
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        severity: diagnostic.category === ts.DiagnosticCategory.Error ? 'error' : 'warning'
      };
    });
    
    // Generate report
    if (issues.length > 0) {
      console.log('TypeScript issues found:');
      issues.forEach(issue => {
        console.log(`${issue.severity.toUpperCase()}: ${issue.filePath}:${issue.line}:${issue.character} - ${issue.message} (TS${issue.code})`);
      });
      
      // Write report to file
      const reportPath = path.resolve('typescript-issues.json');
      fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2));
      console.log(`Report written to ${reportPath}`);
    } else {
      console.log('No TypeScript issues found!');
    }
  } catch (err) {
    console.error('Failed to check TypeScript issues:', err);
  }
};

checkTypeScriptIssues();
