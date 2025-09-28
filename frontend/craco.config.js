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

      // Bundle optimization configurations - only apply in production
      if (process.env.NODE_ENV === 'production') {
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              // Separate vendor chunk for large libraries
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                priority: 10,
                reuseExistingChunk: true,
              },
              // Separate chunk for Aptos SDK (large library)
              aptos: {
                test: /[\\/]node_modules[\\/]@aptos-labs[\\/]/,
                name: 'aptos-sdk',
                priority: 20,
                reuseExistingChunk: true,
              },
              // Separate chunk for p5.js (graphics library)
              p5: {
                test: /[\\/]node_modules[\\/]p5[\\/]/,
                name: 'p5-graphics',
                priority: 15,
                reuseExistingChunk: true,
              },
              // Common chunk for frequently used modules
              common: {
                name: 'common',
                minChunks: 2,
                priority: 5,
                reuseExistingChunk: true,
              },
            },
          },
          // Enable tree shaking
          usedExports: true,
          sideEffects: false,
        };
      }

      // Minimize bundle size in production
      if (process.env.NODE_ENV === 'production') {
        // Remove console logs in production
        webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer || [];
        
        // Add terser plugin configuration for better minification
        const TerserPlugin = require('terser-webpack-plugin');
        webpackConfig.optimization.minimizer.push(
          new TerserPlugin({
            terserOptions: {
              compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug'],
              },
              mangle: {
                safari10: true,
              },
            },
            extractComments: false,
          })
        );
      }
      
      return webpackConfig;
    },
  },
};
