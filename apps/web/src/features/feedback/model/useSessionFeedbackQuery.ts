// 세션 피드백 생성·조회 상태 — 대화 종료 후 총평/상세 화면에 쓴다
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { preload } from 'react-dom';

import { createSessionFeedback } from '../api/session-feedback';
import { TRACK_CHARACTER_SRC } from '../lib/track-character';

// 대화 완료 시점에 미리 생성(prefetch)해두고, 피드백 화면이 같은 키로 즉시 읽게 한다
export const sessionFeedbackKey = (sessionId: number | null) =>
  ['session-feedback', sessionId] as const;

// 키·생성 요청·캐시 정책이 아래 훅과 반드시 같아야 해서 여기 함께 둔다
const prefetchSessionFeedback = (queryClient: QueryClient, sessionId: number) =>
  queryClient.prefetchQuery({
    queryKey: sessionFeedbackKey(sessionId),
    queryFn: () => createSessionFeedback(sessionId),
    staleTime: Infinity,
  });

// 대화 완료 시점에 부른다 — 총평을 미리 만들고, 총평 첫 화면의 트랙 래디 그림도 받아 둔다. 총평이 무엇을 그리는지는 여기서만 안다
export const prepareFeedbackSummary = (
  queryClient: QueryClient,
  sessionId: number,
) => {
  preload(TRACK_CHARACTER_SRC, { as: 'image' });
  return prefetchSessionFeedback(queryClient, sessionId);
};

// 피드백 생성은 POST라, 한 번 만들면 다시 만들지 않게 캐시를 고정한다.
// StrictMode 이중 마운트는 react-query가 동일 키 in-flight 요청을 합쳐 중복 POST를 막는다.
export const useSessionFeedbackQuery = (sessionId: number | null) => {
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: sessionFeedbackKey(sessionId),
    queryFn: () => createSessionFeedback(sessionId as number),
    enabled: sessionId !== null,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  return {
    feedback: data ?? null,
    error,
    isLoading: sessionId !== null && isPending,
    // 받아 둔 것이 있는데 다시 받는 중 — 잠긴 응답을 유료가 된 뒤 갈아끼울 때. 화면은 옛 값을 보이되 잠긴 문을 열지 않는다
    isRefreshing: data !== undefined && isFetching,
  };
};
