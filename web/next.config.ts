import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for better debugging
  experimental: {
    // Enable webpack build worker for faster builds
    webpackBuildWorker: true,
  },

  // Add empty turbopack config to silence build warnings
  turbopack: {},

  // Configure webpack for better debugging
  webpack: (config, { dev, isServer }) => {
    // Add source maps for better debugging
    if (dev) {
      config.devtool = 'eval-source-map';
    }

    // Add aliases for easier imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './'),
    };

    return config;
  },

  // Configure headers for better development
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Enable bundle analyzer in development
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config: any) => {
      if (process.env.NODE_ENV === 'production') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: './analyze/client.html',
          })
        );
      }
      return config;
    },
  }),
};

export default nextConfig;
