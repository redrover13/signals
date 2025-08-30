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
  remotes: ['frontend-agents'],
  shared: (name, config) => {
    // List shared dependencies here to avoid duplicating them
    const sharedLibs = {
      '@nx-monorepo/utils/signals': {
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
    };

    return sharedLibs[name] || config.default;
  },
};

module.exports = moduleFederationConfig;
