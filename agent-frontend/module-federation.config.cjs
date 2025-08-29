// @ts-check

/**
 * @fileoverview Module Federation Configuration
 * 
 * This file configures the module federation setup for the agent frontend.
 * It defines which modules are exposed and which dependencies are shared.
 * 
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * @type {import('@nx/devkit').ModuleFederationConfig}
 **/
const moduleFederationConfig = {
  name: 'agent-frontend',
  
  // Modules exposed by this application
  exposes: {
    './Module': './src/remote-entry.ts',
    './SignalsDemo': './src/app/signals-demo/remote-entry.ts',
    './AgentInterface': './src/app/components/agent-interface.tsx',
  },
  
  // Remote modules imported from other applications
  remotes: {
    'frontend-agents': process.env.NODE_ENV === 'production'
      ? 'https://agents.dulcedesaigon.com/remoteEntry.js'
      : 'http://localhost:4201/remoteEntry.js',
  },
  
  // Configure remote fallbacks
  remoteOptions: {
    'frontend-agents': {
      fallback: './src/fallbacks/frontend-agents-fallback.tsx',
    },
  },
  
  // Configure shared dependencies
  shared: (libraryName, defaultConfig) => {
    // List of dependencies to share
    const sharedLibs = {
      // Signals library - must be shared as a singleton to maintain state across apps
      '@nx-monorepo/utils/signals': {
        singleton: true,
        eager: true,
        requiredVersion: false,
      },
      // Core React libraries
      'react': {
        singleton: true,
        eager: true,
        requiredVersion: false,
      },
      'react-dom': {
        singleton: true,
        eager: true,
        requiredVersion: false,
      },
      'react-router-dom': {
        singleton: true,
        eager: true,
        requiredVersion: false,
      },
      // UI component libraries
      '@mui/material': {
        singleton: true,
        eager: false,
        requiredVersion: false,
      },
      '@mui/icons-material': {
        singleton: true,
        eager: false,
        requiredVersion: false,
      },
      // State management
      'recoil': {
        singleton: true,
        eager: false,
        requiredVersion: false,
      },
      // Utility libraries
      'lodash': {
        singleton: false,
        eager: false,
        requiredVersion: false,
      },
      'date-fns': {
        singleton: false,
        eager: false,
        requiredVersion: false,
      },
      // Internal libraries
      '@nx-monorepo/utils/common': {
        singleton: true,
        eager: false,
        requiredVersion: false,
      },
      'agents-sdk': {
        singleton: true,
        eager: false,
        requiredVersion: false,
      },
      '@nx-monorepo/shared-ui': {
        singleton: true,
        eager: false,
        requiredVersion: false,
      },
    };

    return sharedLibs[libraryName] || defaultConfig;
  },
  
  // Module Federation plugin options
  options: {
    // Add Webpack 5 Module Federation plugin options here
    skipSharingNextInternals: true, // Avoids sharing Next.js internals
    enableImageLoaderFix: true, // Fix for image loading issues
    enableUrlLoaderFix: true, // Fix for URL loading issues
  }
};

export default moduleFederationConfig;
