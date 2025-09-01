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
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { federation } from '@module-federation/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

// Import the module federation config
import moduleFederationConfig from './module-federation.config.js';

export default defineConfig(async ({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // Create federation plugin
  const federationPlugin = await federation({
    ...moduleFederationConfig,
    // Additional Module Federation options can be set here
  });

  return {
    root: __dirname,
    cacheDir: '../node_modules/.vite/agent-frontend',
    
    // Define environment variables safely - only expose needed variables
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.VITE_APP_NAME': JSON.stringify(env.VITE_APP_NAME || 'Agent Frontend'),
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3000'),
      // Add other specific environment variables as needed
      // Never expose the entire process.env object
    },
    
    server: {
      port: 4200,
      host: 'localhost',
      // Add security headers to development server
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;",
      },
    },
    
    preview: {
      port: 4200,
      host: 'localhost',
    },
    
    plugins: [
      federationPlugin,
      react({
        // Enable Fast Refresh for development
        fastRefresh: true,
        // Improve build performance
        babel: {
          plugins: [
            ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }]
          ]
        }
      }),
      nxViteTsPaths(),
      nxCopyAssetsPlugin(['*.md']),
      
      // Add bundle visualization in analyze mode
      mode === 'analyze' && visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
      }),
      
      // Add PWA support
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'Dulce de Saigon Agent Frontend',
          short_name: 'Agent Frontend',
          theme_color: '#4CAF50',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
    
    // Enable worker support
    worker: {
      plugins: () => [nxViteTsPaths()],
    },
    
    build: {
      outDir: '../dist/agent-frontend',
      emptyOutDir: true,
      reportCompressedSize: true,
      target: 'esnext',
      // Optimize chunks
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Create vendor chunks for better caching
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('@nx-monorepo/utils/signals')) {
                return 'signals';
              }
              // Group other dependencies by their top-level module
              const match = id.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
              if (match) {
                return `vendor-${match[1].replace('@', '')}`;
              }
              return 'vendor';
            }
          },
          // Optimize chunk loading
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      // Enable source maps in development
      sourcemap: mode !== 'production',
      // Minimize in production
      minify: mode === 'production' ? 'esbuild' : false,
      // Configure CSS optimization
      cssMinify: mode === 'production',
    },
    
    // Configure testing
    test: {
      globals: true,
      cache: {
        dir: '../node_modules/.vitest',
      },
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      setupFiles: ['./src/test-setup.ts'], // Points to universal test setup
      coverage: {
        reporter: ['text', 'html'],
        exclude: ['**/*.{test,spec}.{ts,tsx}', '**/index.ts', '**/*.d.ts'],
      },
      deps: {
        // Ensure dependencies needed for tests are properly handled
        inline: [
          '@testing-library/react',
          '@testing-library/user-event',
          '@testing-library/jest-dom'
        ]
      },
      // Add global object for compatibility with Jest tests
      define: {
        'window.jest': 'vi',
        'globalThis.jest': 'vi'
      },
    },
    
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react', 
        'react-dom',
        'lodash-es',
        '@testing-library/react',
        '@testing-library/user-event',
      ],
      exclude: ['@nx-monorepo/utils/signals'],
      esbuildOptions: {
        target: 'esnext',
        supported: { 
          'top-level-await': true 
        },
      }
    },
  };
});
