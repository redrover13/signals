#!/usr/bin/env node

/**
 * TypeScript Configuration Standardizer
 * 
 * This script analyzes and standardizes TypeScript configurations across the project.
 * It generates recommendations for consistent tsconfig settings and can optionally
 * apply those recommendations.
 * 
 * Usage:
 *   node typescript-diagnostics/scripts/standardize-tsconfig.js [--apply]
 * 
 * Options:
 *   --apply    Apply the recommended changes (default: false)
 * 
 * Output:
 *   - Generates JSON report in typescript-diagnostics/reports/
 *   - Creates recommended tsconfig templates in typescript-diagnostics/configs/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const REPORTS_DIR = path.resolve(ROOT_DIR, 'typescript-diagnostics/reports');
const CONFIGS_DIR = path.resolve(ROOT_DIR, 'typescript-diagnostics/configs');

// Parse command line arguments
const APPLY_CHANGES = process.argv.includes('--apply');

// Ensure directories exist
for (const dir of [REPORTS_DIR, CONFIGS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

console.log('🔧 TypeScript Configuration Standardizer');
console.log('=========================================');
console.log(`Mode: ${APPLY_CHANGES ? 'Apply changes' : 'Analysis only'}`);

// Store all diagnostic data
const configAnalysis = {
  timestamp: new Date().toISOString(),
  totalConfigs: 0,
  configs: [],
  commonSettings: {},
  inconsistentSettings: {},
  recommendations: {},
  appliedChanges: []
};

/**
 * Find all tsconfig files in the project
 */
function findTsConfigs() {
  console.log('\n📊 Finding TypeScript configuration files...');
  
  const tsconfigFiles = [];
  
  function traverse(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        if (file.name !== 'node_modules' && file.name !== 'dist' && !file.name.startsWith('.')) {
          traverse(fullPath);
        }
      } else if (file.isFile() && file.name.startsWith('tsconfig') && file.name.endsWith('.json')) {
        tsconfigFiles.push(fullPath);
      }
    }
  }
  
  traverse(ROOT_DIR);
  configAnalysis.totalConfigs = tsconfigFiles.length;
  console.log(`Found ${tsconfigFiles.length} TypeScript configuration files`);
  
  return tsconfigFiles;
}

/**
 * Analyze tsconfig files for inconsistencies
 */
function analyzeTsConfigs(tsconfigFiles) {
  console.log('\n🔍 Analyzing TypeScript configurations...');
  
  // Track settings across all configs
  const settingsMap = new Map();
  
  // Process each config file
  for (const configPath of tsconfigFiles) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);
      const relativeConfigPath = configPath.replace(ROOT_DIR + '/', '');
      
      // Extract key information
      const configInfo = {
        path: relativeConfigPath,
        extends: config.extends,
        hasExtendsRoot: config.extends && (
          config.extends === './tsconfig.base.json' || 
          config.extends === './tsconfig.json' ||
          config.extends === '../tsconfig.base.json' || 
          config.extends === '../tsconfig.json'
        ),
        compilerOptions: config.compilerOptions || {},
        include: config.include,
        exclude: config.exclude,
        references: config.references
      };
      
      // Add to analysis
      configAnalysis.configs.push(configInfo);
      
      // Skip extended configs for settings analysis to avoid duplication
      if (configInfo.extends) {
        console.log(`  - ${relativeConfigPath} (extends ${configInfo.extends})`);
        continue;
      }
      
      console.log(`  - ${relativeConfigPath}`);
      
      // Track compiler options
      if (config.compilerOptions) {
        for (const [key, value] of Object.entries(config.compilerOptions)) {
          if (!settingsMap.has(key)) {
            settingsMap.set(key, { values: new Map(), configs: [] });
          }
          
          const setting = settingsMap.get(key);
          
          // Track the value and config
          const valueStr = JSON.stringify(value);
          if (!setting.values.has(valueStr)) {
            setting.values.set(valueStr, { value, count: 0, configs: [] });
          }
          
          const valueEntry = setting.values.get(valueStr);
          valueEntry.count++;
          valueEntry.configs.push(relativeConfigPath);
          
          // Track configs using this setting
          setting.configs.push(relativeConfigPath);
        }
      }
    } catch (error) {
      console.error(`Error analyzing ${configPath}:`, error.message);
    }
  }
  
  // Identify common and inconsistent settings
  for (const [key, setting] of settingsMap.entries()) {
    // Skip if only one config uses this setting
    if (setting.configs.length <= 1) continue;
    
    // Check if the setting is consistent across configs
    if (setting.values.size === 1) {
      // Consistent setting
      const [valueStr] = setting.values.keys();
      const { value, count } = setting.values.get(valueStr);
      
      configAnalysis.commonSettings[key] = {
        value,
        count,
        consistent: true
      };
    } else {
      // Inconsistent setting
      configAnalysis.inconsistentSettings[key] = {
        values: Array.from(setting.values.entries()).map(([valueStr, entry]) => ({
          value: entry.value,
          count: entry.count,
          configs: entry.configs
        })),
        consistent: false
      };
    }
  }
  
  console.log(`Analyzed ${configAnalysis.totalConfigs} TypeScript configurations`);
  console.log(`Found ${Object.keys(configAnalysis.commonSettings).length} common settings`);
  console.log(`Found ${Object.keys(configAnalysis.inconsistentSettings).length} inconsistent settings`);
}

/**
 * Generate recommendations for standardizing TypeScript configurations
 */
function generateRecommendations() {
  console.log('\n🧠 Generating configuration recommendations...');
  
  // Analyze extends patterns
  const extendsPatterns = configAnalysis.configs.filter(c => c.extends).map(c => c.extends);
  const extendsCount = new Map();
  for (const pattern of extendsPatterns) {
    extendsCount.set(pattern, (extendsCount.get(pattern) || 0) + 1);
  }
  
  // Analyze if we need a base config
  const needsBaseConfig = configAnalysis.configs.some(c => !c.hasExtendsRoot) && 
                          Object.keys(configAnalysis.inconsistentSettings).length > 0;
  
  // Recommend base config structure
  const baseConfig = {
    compilerOptions: {
      target: "ESNext",
      module: "ESNext",
      moduleResolution: "NodeNext",
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      noImplicitReturns: true,
      forceConsistentCasingInFileNames: true
    }
  };
  
  // Add commonly used settings
  for (const [key, setting] of Object.entries(configAnalysis.commonSettings)) {
    // Skip settings already included
    if (baseConfig.compilerOptions[key] !== undefined) continue;
    
    baseConfig.compilerOptions[key] = setting.value;
  }
  
  // For inconsistent settings, use the most common value or a reasonable default
  for (const [key, setting] of Object.entries(configAnalysis.inconsistentSettings)) {
    // Skip settings already included
    if (baseConfig.compilerOptions[key] !== undefined) continue;
    
    // Find the most common value
    const mostCommon = setting.values.sort((a, b) => b.count - a.count)[0];
    
    // Only add if it's used in more than one config
    if (mostCommon.count > 1) {
      baseConfig.compilerOptions[key] = mostCommon.value;
    }
  }
  
  // Add paths if they exist in the root tsconfig
  try {
    const rootTsConfig = path.join(ROOT_DIR, 'tsconfig.base.json');
    if (fs.existsSync(rootTsConfig)) {
      const content = fs.readFileSync(rootTsConfig, 'utf8');
      const config = JSON.parse(content);
      
      if (config.compilerOptions && config.compilerOptions.paths) {
        baseConfig.compilerOptions.paths = config.compilerOptions.paths;
      }
    }
  } catch (error) {
    console.error('Error reading root tsconfig:', error.message);
  }
  
  // Store the recommendations
  configAnalysis.recommendations.baseConfig = baseConfig;
  
  // Recommend app config
  configAnalysis.recommendations.appConfig = {
    extends: "./tsconfig.base.json",
    compilerOptions: {
      outDir: "./dist",
      types: ["node"]
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist", "test", "**/*.spec.ts"]
  };
  
  // Recommend library config
  configAnalysis.recommendations.libConfig = {
    extends: "./tsconfig.base.json",
    compilerOptions: {
      outDir: "./dist",
      declaration: true
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist", "test", "**/*.spec.ts"]
  };
  
  // Recommend test config
  configAnalysis.recommendations.testConfig = {
    extends: "./tsconfig.base.json",
    compilerOptions: {
      types: ["jest", "node"]
    },
    include: ["test/**/*", "**/*.spec.ts"],
    exclude: ["node_modules", "dist"]
  };
  
  console.log('Generated configuration recommendations');
}

/**
 * Save configuration templates
 */
function saveConfigTemplates() {
  console.log('\n💾 Saving configuration templates...');
  
  // Save base config template
  fs.writeFileSync(
    path.join(CONFIGS_DIR, 'tsconfig.base.template.json'),
    JSON.stringify(configAnalysis.recommendations.baseConfig, null, 2)
  );
  
  // Save app config template
  fs.writeFileSync(
    path.join(CONFIGS_DIR, 'tsconfig.app.template.json'),
    JSON.stringify(configAnalysis.recommendations.appConfig, null, 2)
  );
  
  // Save library config template
  fs.writeFileSync(
    path.join(CONFIGS_DIR, 'tsconfig.lib.template.json'),
    JSON.stringify(configAnalysis.recommendations.libConfig, null, 2)
  );
  
  // Save test config template
  fs.writeFileSync(
    path.join(CONFIGS_DIR, 'tsconfig.test.template.json'),
    JSON.stringify(configAnalysis.recommendations.testConfig, null, 2)
  );
  
  console.log('Saved configuration templates to typescript-diagnostics/configs/');
}

/**
 * Apply recommended configurations
 */
function applyRecommendations() {
  if (!APPLY_CHANGES) {
    console.log('\n⏩ Skipping applying changes (use --apply to apply changes)');
    return;
  }
  
  console.log('\n✏️ Applying recommended configurations...');
  
  // 1. Update root tsconfig.base.json
  try {
    const rootTsConfigPath = path.join(ROOT_DIR, 'tsconfig.base.json');
    if (fs.existsSync(rootTsConfigPath)) {
      // Backup the existing config
      const backupPath = path.join(ROOT_DIR, 'tsconfig.base.backup.json');
      fs.copyFileSync(rootTsConfigPath, backupPath);
      
      // Update with recommended base config
      fs.writeFileSync(
        rootTsConfigPath,
        JSON.stringify(configAnalysis.recommendations.baseConfig, null, 2)
      );
      
      configAnalysis.appliedChanges.push({
        path: 'tsconfig.base.json',
        action: 'updated',
        backup: 'tsconfig.base.backup.json'
      });
      
      console.log(`Updated tsconfig.base.json with recommended configuration`);
    } else {
      // Create new base config
      fs.writeFileSync(
        rootTsConfigPath,
        JSON.stringify(configAnalysis.recommendations.baseConfig, null, 2)
      );
      
      configAnalysis.appliedChanges.push({
        path: 'tsconfig.base.json',
        action: 'created'
      });
      
      console.log(`Created tsconfig.base.json with recommended configuration`);
    }
  } catch (error) {
    console.error('Error updating root tsconfig:', error.message);
  }
  
  // 2. Update or create app configs
  // This would require more detailed analysis of the project structure
  // For now, we'll just provide the templates
  
  console.log('Applied recommended configurations');
}

/**
 * Save analysis report
 */
function saveReport() {
  // Save JSON report
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'tsconfig-analysis.json'),
    JSON.stringify(configAnalysis, null, 2)
  );
  
  // Generate human-readable report
  const readableReport = [
    '# TypeScript Configuration Analysis',
    '',
    `Generated: ${new Date(configAnalysis.timestamp).toLocaleString()}`,
    '',
    '## Configuration Overview',
    '',
    `Total TypeScript configurations: ${configAnalysis.totalConfigs}`,
    `Configurations extending another config: ${configAnalysis.configs.filter(c => c.extends).length}`,
    `Configurations not extending any config: ${configAnalysis.configs.filter(c => !c.extends).length}`,
    '',
    '## Inconsistent Settings',
    ''
  ];
  
  // Add inconsistent settings
  if (Object.keys(configAnalysis.inconsistentSettings).length > 0) {
    for (const [key, setting] of Object.entries(configAnalysis.inconsistentSettings)) {
      readableReport.push(`### ${key}`);
      readableReport.push('');
      
      for (const value of setting.values) {
        readableReport.push(`- Value: \`${JSON.stringify(value.value)}\``);
        readableReport.push(`  - Used in ${value.count} configs: ${value.configs.join(', ')}`);
      }
      
      readableReport.push('');
    }
  } else {
    readableReport.push('No inconsistent settings found.');
    readableReport.push('');
  }
  
  // Add recommendations
  readableReport.push('## Recommendations');
  readableReport.push('');
  readableReport.push('### Base Configuration');
  readableReport.push('');
  readableReport.push('```json');
  readableReport.push(JSON.stringify(configAnalysis.recommendations.baseConfig, null, 2));
  readableReport.push('```');
  readableReport.push('');
  
  readableReport.push('### Application Configuration');
  readableReport.push('');
  readableReport.push('```json');
  readableReport.push(JSON.stringify(configAnalysis.recommendations.appConfig, null, 2));
  readableReport.push('```');
  readableReport.push('');
  
  readableReport.push('### Library Configuration');
  readableReport.push('');
  readableReport.push('```json');
  readableReport.push(JSON.stringify(configAnalysis.recommendations.libConfig, null, 2));
  readableReport.push('```');
  readableReport.push('');
  
  readableReport.push('### Test Configuration');
  readableReport.push('');
  readableReport.push('```json');
  readableReport.push(JSON.stringify(configAnalysis.recommendations.testConfig, null, 2));
  readableReport.push('```');
  readableReport.push('');
  
  // Add applied changes
  if (APPLY_CHANGES && configAnalysis.appliedChanges.length > 0) {
    readableReport.push('## Applied Changes');
    readableReport.push('');
    
    for (const change of configAnalysis.appliedChanges) {
      readableReport.push(`- ${change.path}: ${change.action}`);
      if (change.backup) {
        readableReport.push(`  - Backup created at ${change.backup}`);
      }
    }
  }
  
  // Save human-readable report
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'tsconfig-analysis.md'),
    readableReport.join('\n')
  );
  
  console.log(`Reports saved to typescript-diagnostics/reports/`);
}

// Run the analysis
const tsconfigFiles = findTsConfigs();
analyzeTsConfigs(tsconfigFiles);
generateRecommendations();
saveConfigTemplates();
applyRecommendations();
saveReport();

console.log('\n✅ TypeScript configuration analysis completed!');
