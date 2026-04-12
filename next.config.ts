import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  poweredByHeader: false,
  compress: true,
  webpack(config, { isServer }) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
      topLevelAwait: true,
    };
    // Serve pandoc.wasm as a URL asset so the browser entry can fetch() it
    if (!isServer) {
      config.module.rules.push({
        test: /node_modules[\\/]pandoc-wasm[\\/]src[\\/]pandoc\.wasm$/,
        type: "asset/resource",
      });
    }
    return config;
  },
};

export default nextConfig;
