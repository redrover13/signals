import type { Config } from 'jest';
import { getJestProjectsAsync } from '@nx/jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.base.json';

export default async (): Promise<Config> => ({
  projects: await getJestProjectsAsync(),
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
});
