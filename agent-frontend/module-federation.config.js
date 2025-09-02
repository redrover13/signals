// @ts-check

/**
 * @type {import('@nx/devkit').ModuleFederationConfig}
 **/
const moduleFederationConfig = {
  name: 'agent-frontend',
  exposes: {
    './Module': './src/remote-entry.ts',
    './SignalsDemo': './src/app/signals-demo/remote-entry.ts',
  },
  // Configure remotes with a development fallback
  remotes: {
    'frontend-agents': {
      external: 'Promise.resolve({})',
      externalType: 'promise'
    }
  },
  shared: (name, config) => {
    // List shared dependencies here to avoid duplicating them
    const sharedLibs = {
      '@nx-monorepo/utils/signals': {
        singleton: true,
        eager: true,
        requiredVersion: false,
      },
      'agents-sdk': {
        singleton: true,
        eager: true,
        requiredVersion: false,
      },
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
      'lodash-es': {
        singleton: true,
        eager: false,
        requiredVersion: false,
      }
    };

    return sharedLibs[name] || config.default;
  },
};

module.exports = moduleFederationConfig;
export default moduleFederationConfig;
