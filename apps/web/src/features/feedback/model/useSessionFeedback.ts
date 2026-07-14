// 세션 피드백 생성·조회 상태 — 대화 종료 후 총평/상세 화면에 쓴다
import { useQuery } from '@tanstack/react-query';

import { createSessionFeedback } from '../api/session-feedback';

// 피드백 생성은 POST라, 한 번 만들면 다시 만들지 않게 캐시를 고정한다.
// StrictMode 이중 마운트는 react-query가 동일 키 in-flight 요청을 합쳐 중복 POST를 막는다.
export const useSessionFeedback = (sessionId: number | null) => {
  const { data, error, isPending } = useQuery({
    queryKey: ['session-feedback', sessionId],
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
  };
};
