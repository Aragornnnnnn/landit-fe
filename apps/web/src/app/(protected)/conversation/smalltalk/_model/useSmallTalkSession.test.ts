// useSmallTalkSession — 세션 시작 요청이 서버와 맺은 약속을 지키는지 검증한다.
// 상대를 안 실으면 서버가 요청을 거절하는데, 화면만 봐서는 드러나지 않아 테스트가 대신 지킨다
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as smallTalkApi from '@/features/small-talk/api/small-talk';

import { useSmallTalkSession } from './useSmallTalkSession';

vi.mock('@/shared/monitoring/report', () => ({
  reportError: vi.fn(),
  reportWarning: vi.fn(),
}));

vi.mock('@/features/conversation/api/session', () => ({
  endSession: vi.fn(),
}));

vi.mock('@/features/small-talk/api/small-talk', () => ({
  startSmallTalkSession: vi.fn(),
}));

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

const startSmallTalkSession = vi.mocked(smallTalkApi.startSmallTalkSession);

describe('useSmallTalkSession', () => {
  it('세션을 시작할 때 홈에서 고른 상대를 함께 보낸다', async () => {
    startSmallTalkSession.mockResolvedValue({
      sessionId: 7,
    } as Awaited<ReturnType<typeof smallTalkApi.startSmallTalkSession>>);

    renderHook(() =>
      useSmallTalkSession({
        startMode: 'AI_FIRST',
        topicId: 3,
        partner: 'marco',
      }),
    );

    await waitFor(() =>
      expect(startSmallTalkSession).toHaveBeenCalledWith({
        startMode: 'AI_FIRST',
        topicId: 3,
        characterId: 'marco',
      }),
    );
  });
});
