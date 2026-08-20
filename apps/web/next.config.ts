/**
 * web 앱 Next.js 설정.
 *
 * 명시한 설정
 * - transpilePackages: 워크스페이스 패키지(@landit/*)를 web 빌드에서 함께 컴파일
 * - reactCompiler: 자동 메모이제이션 — "수동 useCallback/useMemo 금지" 팀 규칙의 전제
 * - compiler.removeConsole: 프로덕션 빌드(next build)에서만 console.* 전부 제거.
 *   NODE_ENV로 직접 분기 — 옵션 자체가 dev·build를 안 가려서, 걸어두면 `next dev`에서도 지워진다.
 *   유지해야 할 정보(예: API 라우트 실패)는 reportError/reportWarning으로 Sentry에 별도 보고한다
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
    // next dev에서는 끈다 — removeConsole은 NODE_ENV를 안 가려서, 켜두면 로컬 개발 중에도
    // console이 안 보인다 (실제 dev 서버 빌드로 확인함).
    // 프로덕션에선 error도 예외 없이 지운다 — 남겨야 할 정보는 reportError/reportWarning으로
    // Sentry에 이미 보고되고 있어서, console에 중복으로 남길 이유가 없다
    removeConsole: process.env.NODE_ENV === 'production',
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
  // 업로드 후 산출물에서 지운다 — 원본 코드 노출 방지, 원본 스택은 Sentry 안에서만 보인다.
  // 이 옵션은 빌드 뒤 static JS의 sourceMappingURL 주석을 정규식으로 지우는데, 원본 정규식은
  // 줄 시작 앵커가 없어 문자열 안의 "//# sourceMappingURL="부터 파일 끝까지 잘라낸다
  // (rrweb 청크가 잘려 Amplitude 세션 리플레이가 죽었음). patches/@sentry__nextjs 로 앵커를 붙여둠 —
  // Sentry 버전을 올릴 때 업스트림에 고쳐졌는지 확인하고 패치를 재적용하거나 제거할 것
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
