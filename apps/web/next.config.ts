import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@landit/bridge'],
  reactCompiler: true,
};

export default nextConfig;
