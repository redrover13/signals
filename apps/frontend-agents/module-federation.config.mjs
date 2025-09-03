// @ts-check

/**
 * @type {import('@nx/devkit').ModuleFederationConfig}
 **/
const moduleFederationConfig = {
  name: 'frontend-agents',
  // The federation of this remote Next.js app
  remotes: ['agent-frontend'],
  // Modules exposed by this Next.js application
  exposes: {
    './AgentInterface': './src/components/AgentInterface.tsx',
  },
  shared: (name, config) => {
    // List shared dependencies here to avoid duplicating them
    const sharedLibs = {
      '@dulce/utils/signals': {
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

export default moduleFederationConfig;
