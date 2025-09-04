/**
 * @fileoverview update-project-configs module for the scripts component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Script to update project configuration files
 */
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ProjectConfig {
  name?: string;
  $schema?: string;
  projectType?: 'application' | 'library';
  sourceRoot?: string;
  targets?: Record<string, any>;
  tags?: string[];
  implicitDependencies?: string[];
  namedInputs?: Record<string, any>;
}

const STANDARD_ESLINT_CONFIG = {
  executor: '@nx/eslint:lint',
  outputs: ['{options.outputFile}'],
  options: {
    lintFilePatterns: ['libs/**/*.ts', 'libs/**/*.html'],
  },
};

const STANDARD_TEST_CONFIG = {
  executor: '@nx/jest:jest',
  outputs: ['{workspaceRoot}/coverage/{projectRoot}'],
  options: {
    jestConfig: 'jest.config.ts',
    passWithNoTests: true,
  },
  configurations: {
    ci: {
      ci: true,
      codeCoverage: true,
    },
  },
};

const STANDARD_BUILD_CONFIG = {
  executor: '@nx/js:tsc',
  outputs: ['{options.outputPath}'],
  options: {
    outputPath: 'dist/{projectRoot}',
    tsConfig: '{projectRoot}/tsconfig.lib.json',
    packageJson: '{projectRoot}/package.json',
    main: '{projectRoot}/src/index.ts',
    assets: ['{projectRoot}/*.md'],
  },
};

/**
 * Update project configuration files
 */
async function updateProjectConfigs(): Promise<void> {
  const projectPaths = await glob('libs/**/project.json');

  for (const projectPath of projectPaths) {
    console.log(`Updating ${projectPath}...`);

    try {
      const configContent = fs.readFileSync(projectPath, 'utf8');
      const config: ProjectConfig = JSON.parse(configContent);

      // Extract domain from path for tagging
      const pathParts = path.dirname(projectPath).split(path.sep);
      const domain = pathParts[1]; // 'libs/domain/...'

      // Add standard configurations
      if (config?.targets) {
        config.targets['build'] = {
          ...STANDARD_BUILD_CONFIG,
          ...config.targets['build'],
        };

        config.targets['lint'] = {
          ...STANDARD_ESLINT_CONFIG,
          ...config.targets['lint'],
        };

        config.targets['test'] = {
          ...STANDARD_TEST_CONFIG,
          ...config.targets['test'],
        };
      }

      // Add named inputs for cache busting
      if (config) {
        config.namedInputs = {
          default: ['{projectRoot}/**/*', '!{projectRoot}/**/*.test.ts'],
          production: ['default'],
          ...config.namedInputs,
        };
      }

      // Add domain tags
      if (config) {
        config.tags = config.tags || [];
      }

      if (config?.tags && domain && !config.tags.includes(domain)) {
        config.tags.push(domain);
      }

      // Write updated config
      fs.writeFileSync(projectPath, JSON.stringify(config, null, 2), 'utf8');
      console.log(`✅ Updated ${projectPath}`);
    } catch (err) {
      console.error(`Error updating ${projectPath}:`, err);
    }
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('🔄 Updating project configurations...');
  await updateProjectConfigs();
  console.log('✅ Project configurations updated successfully!');
}

// Run the script
main().catch((err) => {
  console.error('Error updating project configurations:', err);
  process.exit(1);
});
