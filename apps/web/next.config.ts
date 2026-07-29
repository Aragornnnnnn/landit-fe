import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

// 브라우저가 백엔드를 직접 호출하면 CORS가 걸리므로, 같은 오리진의 /api/*를 백엔드로 프록시한다
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const nextConfig: NextConfig = {
  transpilePackages: ['@landit/analytics', '@landit/bridge'],
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

// 소스맵은 SENTRY_AUTH_TOKEN이 있는 배포 빌드에서만 올린다
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // 업로드 후 산출물에서 지운다 — 원본 코드 노출 방지
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },
  disableLogger: true,
  // 업로드 실패가 배포를 막지 않게 경고로 낮춘다
  errorHandler: (err) => {
    console.warn('[sentry] 소스맵 업로드 실패 (빌드는 계속):', err.message);
  },
});
