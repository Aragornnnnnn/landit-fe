// 피드백 전송 — 보내고 나면 보낸 편지함이 낡는다. 전역 staleTime(30s)이 있어
// 명시적 무효화가 없으면 방금 보낸 편지가 목록에 없는 채로 도착한다.
// 계측도 여기서 남긴다 — 화면이 사라진 뒤 도착한 성공도 전송은 전송이다
import { EVENTS } from '@landit/analytics';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { track } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';
import { reportError } from '@/shared/monitoring/report';

import { submitFeedback, type FeedbackType } from '../api/mailbox';
import { mailboxKeys } from './keys';

/** 보낼 한 통 — 글과 첨부 사진(JPEG로 다시 구운 것) */
interface FeedbackDraft {
  content: string;
  images: File[];
}

export const useSendFeedbackMutation = (type: FeedbackType) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ content, images }: FeedbackDraft) =>
      submitFeedback({ type, content }, images),
    // 실패 기록도 여기서 — 화면이 사라진 뒤 실패한 전송은 화면 쪽 콜백이 안 불려 놓친다
    onError: (error) => reportError(error),
    onSuccess: (_, { content, images }) => {
      // 보낸 뒤에만 남긴다 — 실패한 시도가 전송으로 집계되면 지표가 부푼다. 원문은 PII 위험이 있어 길이만
      track(EVENTS.FEEDBACK_SUBMITTED, {
        feedback_type: type,
        length: content.length,
        image_count: images.length,
      });
      void queryClient.invalidateQueries({
        queryKey: mailboxKeys.letters(userId, 'sent'),
      });
    },
  });
};
