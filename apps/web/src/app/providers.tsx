'use client';

// 앱 전역 Provider — React Query 클라이언트를 앱 수명 동안 하나만 유지한다
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 시나리오 목록처럼 "유저 행동으로만 바뀌는" 데이터 기준의 시작값 — 30초 내 화면 이동은 캐시로, 그 뒤엔 백그라운드 갱신.
            // 쿼리별로 덮어쓸 수 있는 전역 기본값이다.
            staleTime: 30_000,
            // TODO(대화 이슈에서 재검토): 아직 기본값으로 둔 손잡이들
            //  - refetchOnWindowFocus(기본 true): WebView 앱 복귀 시 자동 갱신 — 대화 후 언락 반영을 공짜로 얻을 수 있는지 실기기에서 확인
            //  - retry(기본 3회 지수 백오프): 401 재발급은 api/client가 이미 처리하므로, 5xx에 3번 기다리는 게 모바일 UX에 맞는지 (retry: 1 검토)
            //  - gcTime(기본 5분): 화면을 완전히 떠난 캐시의 보관 시간
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
