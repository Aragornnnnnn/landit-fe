// 펼친 편지를 읽음으로 바꾼다 — 화면이 조회와 나란히 선언해 두 가지 일이 다 드러나게 한다
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';
import { reportWarning } from '@/shared/monitoring/report';

import type { LetterDetail } from '../api/letter-detail';
import { markLetterRead } from '../api/letters';
import { mailboxKeys } from './keys';
import { needsReadMark } from './letter-read';

export const useMarkLetterRead = (letter: LetterDetail | null) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const queryClient = useQueryClient();

  // 낡는 건 목록과 미읽음 점뿐이라 그 둘만 걷어낸다 — 도메인 전체를 무효화하면
  // 방금 받아온 이 편지까지 다시 불러온다
  useEffect(() => {
    if (!letter || !needsReadMark(letter)) return;

    markLetterRead(letter.letterId)
      .then(() =>
        queryClient.invalidateQueries({
          queryKey: mailboxKeys.summaries(userId),
        }),
      )
      // 읽음 표시가 늦는 것보다 편지를 못 읽는 게 나쁘다 — 화면은 그대로 두고 보고만 한다
      .catch(reportWarning);
  }, [letter, userId, queryClient]);
};
