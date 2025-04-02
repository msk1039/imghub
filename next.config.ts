import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // webpack: (config, { isServer }) => {
  //   // Add support for web workers
  //   config.module.rules.push({
  //     test: /\.worker\.js$/,
  //     loader: 'worker-loader',
  //     options: {
  //       name: 'static/chunks/[id].worker.js',
  //       publicPath: '/_next/',
  //     },
  //   });
    
  //   return config;
  // },
  output: 'standalone',
};

export default nextConfig;
