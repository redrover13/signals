//@ts-check
const { composePlugins, withNx } = require('@nx/next');
const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

// Import module federation config
const moduleFederationConfig = require('./module-federation.config.cjs');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  // Required for Module Federation to work correctly
  webpack(config, options) {
    // Set the publicPath to support federation
    config.output.publicPath = 'auto';
    
    // Add the Module Federation plugin
    config.plugins.push(
      new NextFederationPlugin({
        ...moduleFederationConfig,
        // Additional NextFederationPlugin options if needed
      })
    );
    
    return config;
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
