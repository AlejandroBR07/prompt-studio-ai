import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: '/prompt-studio-ai',
  assetPrefix: '/prompt-studio-ai/',
};

export default nextConfig;
