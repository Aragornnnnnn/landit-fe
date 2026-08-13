// 피드백 전송 — 보내고 나면 보낸 편지함이 낡는다. 전역 staleTime(30s)이 있어
// 명시적 무효화가 없으면 방금 보낸 편지가 목록에 없는 채로 도착한다
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import type { FeedbackType } from '../api/letter';
import { sendFeedback } from '../api/send-feedback';
import { mailboxKeys } from './keys';

export const useSendFeedbackMutation = (type: FeedbackType) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => sendFeedback(type, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mailboxKeys.letters(userId, 'sent'),
      });
    },
  });
};
