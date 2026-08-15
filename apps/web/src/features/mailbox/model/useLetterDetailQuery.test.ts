// 상세 조회 훅 검증 — 받은 편지는 조회가 읽음 처리라, 받고 나면 목록과 미읽음 개수를 낡은 것으로 표시해야 한다
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  ReceivedLetterDetail,
  SentFeedbackDetail,
} from '../api/letter-detail';
import * as lettersApi from '../api/letters';
import { mailboxKeys } from './keys';
import {
  useReceivedLetterQuery,
  useSentFeedbackQuery,
} from './useLetterDetailQuery';

vi.mock('../api/letters', () => ({
  getReceivedLetterDetail: vi.fn(),
  getSentFeedbackDetail: vi.fn(),
}));

vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 42 } }),
}));

const getReceivedLetterDetail = vi.mocked(lettersApi.getReceivedLetterDetail);
const getSentFeedbackDetail = vi.mocked(lettersApi.getSentFeedbackDetail);

const RECEIVED: ReceivedLetterDetail = {
  letterId: 3,
  letterType: 'REPLY',
  title: '답장',
  contentBlocks: null,
  bodyText: '본문',
  pinned: false,
  sentAt: '2026-08-09T15:47:00',
  readAt: '2026-08-15T10:00:00',
};

const SENT: SentFeedbackDetail = {
  feedbackId: 11,
  type: 'QUESTION',
  title: '문의',
  content: '내용',
  status: 'PENDING',
  resolvedByFeedbackId: null,
  createdAt: '2026-08-08T18:20:00',
  updatedAt: '2026-08-08T18:20:00',
  replies: [],
};

const renderWithClient = <T>(hook: () => T) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const result = renderHook(hook, {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children),
  });
  return { ...result, invalidate };
};

beforeEach(() => {
  getReceivedLetterDetail.mockReset();
  getSentFeedbackDetail.mockReset();
});

describe('useReceivedLetterQuery', () => {
  it('받은 편지를 받고 나면 목록과 미읽음 개수를 다시 묻게 한다', async () => {
    getReceivedLetterDetail.mockResolvedValue(RECEIVED);

    const { result, invalidate } = renderWithClient(() =>
      useReceivedLetterQuery(3),
    );

    await waitFor(() => expect(result.current.letter).toEqual(RECEIVED));
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: mailboxKeys.summaries(42),
    });
  });
});

describe('useSentFeedbackQuery', () => {
  it('보낸 피드백은 읽음이 없어 아무것도 낡게 하지 않는다', async () => {
    getSentFeedbackDetail.mockResolvedValue(SENT);

    const { result, invalidate } = renderWithClient(() =>
      useSentFeedbackQuery(11),
    );

    await waitFor(() => expect(result.current.letter).toEqual(SENT));
    expect(invalidate).not.toHaveBeenCalled();
  });
});
