// 보낸 피드백의 첨부 사진을 장마다 따로 받는다 — 한 장이 실패해도 나머지는 보이고, 실패한 장만 다시 받는다
import { useQueries } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getFeedbackAttachment, type FeedbackAttachment } from '../api/mailbox';
import { mailboxKeys } from './keys';
import { retryUnlessClientError } from './useLetterDetailQuery';

export type AttachmentImage =
  | { status: 'pending' }
  | { status: 'error'; retry: () => void }
  | { status: 'success'; src: string };

export const useAttachmentImagesQuery = (
  attachments: FeedbackAttachment[],
): AttachmentImage[] => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  return useQueries({
    queries: attachments.map((attachment) => ({
      queryKey: mailboxKeys.attachment(userId, attachment.attachmentId),
      // 인증이 필요해 주소를 <img>에 바로 못 넣는다 — 받은 바이트로 이 문서 전용 주소를 만든다.
      // 사진은 바뀌지 않아 한 번 받으면 세션 동안 쓴다(한 통 최대 3장, 장당 1.5MB 안) — 그래서 주소도 돌려주지 않는다
      queryFn: async () =>
        URL.createObjectURL(
          await getFeedbackAttachment(attachment.downloadUrl),
        ),
      enabled: userId !== null,
      staleTime: Infinity,
      gcTime: Infinity,
      retry: retryUnlessClientError,
    })),
    combine: (results) =>
      results.map((result): AttachmentImage => {
        if (result.data) return { status: 'success', src: result.data };
        if (result.isError)
          return { status: 'error', retry: () => void result.refetch() };
        return { status: 'pending' };
      }),
  });
};
