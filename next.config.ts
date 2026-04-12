import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mupdf", "@huggingface/transformers", "@imgly/background-removal", "face-api.js", "tesseract.js", "mammoth", "docx", "xlsx", "jspdf", "html2canvas", "jszip"],
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
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
