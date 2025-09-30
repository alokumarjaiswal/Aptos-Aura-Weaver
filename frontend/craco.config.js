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
            maxInitialRequests: 10,
            maxAsyncRequests: 10,
            cacheGroups: {
              // React and core libraries
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
                name: 'react-vendor',
                priority: 30,
                reuseExistingChunk: true,
              },
              // Aptos SDK - load on demand
              aptos: {
                test: /[\\/]node_modules[\\/]@aptos-labs[\\/]/,
                name: 'aptos-sdk',
                priority: 25,
                chunks: 'async', // Only load when needed
                reuseExistingChunk: true,
              },
              // p5.js graphics - load on demand
              p5: {
                test: /[\\/]node_modules[\\/]p5[\\/]/,
                name: 'p5-graphics',
                priority: 20,
                chunks: 'async', // Only load when generating aura
                reuseExistingChunk: true,
              },
              // Other vendor libraries
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                priority: 10,
                reuseExistingChunk: true,
              },
              // Common app code
              common: {
                name: 'common',
                minChunks: 2,
                priority: 5,
                chunks: 'all',
                reuseExistingChunk: true,
              },
            },
          },
          // Enhanced tree shaking
          usedExports: true,
          sideEffects: false,
          providedExports: true,
          // Module concatenation for smaller bundles
          concatenateModules: true,
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
