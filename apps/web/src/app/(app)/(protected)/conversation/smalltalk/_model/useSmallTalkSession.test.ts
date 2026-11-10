// useSmallTalkSession — 세션 시작 요청이 서버와 맺은 약속을 지키는지 검증한다.
// 상대를 안 실으면 서버가 요청을 거절하는데, 화면만 봐서는 드러나지 않아 테스트가 대신 지킨다
// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { endSession } from '@/features/conversation/api/session';
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
  beforeEach(() => vi.mocked(endSession).mockResolvedValue(undefined as never));

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

  it('응답이 오기 전에 나갔다면 뒤늦게 열린 세션을 바로 종료한다', async () => {
    // given 시작 응답을 쥐고 있다가
    let respond!: (value: { sessionId: number }) => void;
    startSmallTalkSession.mockReturnValue(
      new Promise((resolve) => {
        respond = resolve as typeof respond;
      }) as ReturnType<typeof smallTalkApi.startSmallTalkSession>,
    );
    const { result } = renderHook(() =>
      useSmallTalkSession({ startMode: 'AI_FIRST', partner: 'marco' }),
    );

    // when 나간 뒤에 응답이 온다
    act(() => result.current.end());
    expect(endSession).not.toHaveBeenCalled();
    await act(async () => respond({ sessionId: 9 }));

    // then
    expect(endSession).toHaveBeenCalledWith(9);
    expect(result.current.session).toBeNull();
  });
});
