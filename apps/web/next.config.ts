/**
 * web 앱 Next.js 설정.
 *
 * 명시한 설정
 * - transpilePackages: 워크스페이스 패키지(@landit/*)를 web 빌드에서 함께 컴파일
 * - reactCompiler: 자동 메모이제이션 — "수동 useCallback/useMemo 금지" 팀 규칙의 전제
 * - compiler.removeConsole: 프로덕션 번들에서 console.log·info·debug 제거
 * - rewrites: /api/* → 백엔드 프록시 (CORS 회피)
 * - withSentryConfig: 소스맵을 Sentry에만 올리고 배포 산출물에서는 삭제
 *
 * 안 적었지만 기본값으로 적용 중인 것 (Next 16)
 * - Turbopack이 dev·build 기본 번들러, 프로덕션 minify(SWC)·주석 제거 기본 on
 * - 산출물 파일명은 콘텐츠 해시 — 내용이 바뀌면 이름이 바뀌어 캐시 무효화가 자동
 * - TS 에러는 빌드 실패로 이어짐. ESLint는 빌드에서 안 돌므로 CI에서 별도 실행
 * - productionBrowserSourceMaps=false — 브라우저 공개 소스맵은 안 만든다
 */
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

// 브라우저가 백엔드를 직접 호출하면 CORS가 걸리므로, 같은 오리진의 /api/*를 백엔드로 프록시한다
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const nextConfig: NextConfig = {
  // TS 원본으로 배포되는 패키지들 — 여기 포함되면 compiler.* 변환도 같이 적용된다
  transpilePackages: ['@landit/analytics', '@landit/bridge'],
  reactCompiler: true,
  compiler: {
    // error·warn은 Sentry breadcrumb과 API 라우트 서버 로그로 쓰여서 남긴다
    removeConsole: { exclude: ['error', 'warn'] },
  },
  // env가 없으면 프록시가 조용히 꺼진다 — 빌드는 성공하므로 누락은 런타임에야 드러난다
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
  // 업로드 후 산출물에서 지운다 — 원본 코드 노출 방지, 원본 스택은 Sentry 안에서만 보인다
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },
  // SDK 내부 디버그 로거 제거 (deprecated 경고는 대체 옵션이 Turbopack 미지원이라 유지)
  disableLogger: true,
  // 업로드 실패가 배포를 막지 않게 경고로 낮춘다
  errorHandler: (err) => {
    console.warn('[sentry] 소스맵 업로드 실패 (빌드는 계속):', err.message);
  },
});
