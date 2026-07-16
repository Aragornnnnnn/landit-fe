// React Query 클라이언트 싱글턴 — React 밖(세션 정리 등)에서도 같은 캐시에 접근할 수 있게 모듈 레벨에서 관리한다
import { isServer, QueryClient } from '@tanstack/react-query';

const makeQueryClient = () =>
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
  });

let browserQueryClient: QueryClient | undefined;

// SSR은 요청 간 캐시가 섞이지 않게 매번 새로 만들고, 브라우저는 앱 수명 동안 하나를 재사용한다
export const getQueryClient = () => {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
};
