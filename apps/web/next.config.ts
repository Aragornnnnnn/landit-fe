import type { NextConfig } from 'next';

// 브라우저가 백엔드를 직접 호출하면 CORS가 걸리므로, 같은 오리진의 /api/*를 백엔드로 프록시한다
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const nextConfig: NextConfig = {
  transpilePackages: ['@landit/bridge'],
  reactCompiler: true,
  async rewrites() {
    if (!apiBaseUrl) return [];

    return [
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
