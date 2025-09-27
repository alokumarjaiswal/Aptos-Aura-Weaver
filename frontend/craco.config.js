module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Suppress source map warnings from third-party packages
      webpackConfig.ignoreWarnings = [
        {
          module: /node_modules\/@scure\/bip39/,
        },
        {
          message: /Failed to parse source map/,
        },
      ];
      
      return webpackConfig;
    },
  },
};
