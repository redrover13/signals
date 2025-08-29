/**
 * @fileoverview vite.config module for the agent-frontend component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { federation } from '@module-federation/vite';

// Import the module federation config
import moduleFederationConfig from './module-federation.config.cjs';

export default defineConfig(async () => {
  const federationPlugin = await federation({
    ...moduleFederationConfig,
    // Additional Module Federation options can be set here
  });

  return {
    root: __dirname,
    cacheDir: '../node_modules/.vite/agent-frontend',
    server:{
      port: 4200,
      host: 'localhost',
    },
    preview:{
      port: 4200,
      host: 'localhost',
    },
    plugins: [
      federationPlugin,
      react(), 
      nxViteTsPaths(), 
      nxCopyAssetsPlugin(['*.md'])
    ],
    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [ nxViteTsPaths() ],
    // },
    build: {
      outDir: '../dist/agent-frontend',
      emptyOutDir: true,
      reportCompressedSize: true,
      target: 'esnext',
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
  };
});
