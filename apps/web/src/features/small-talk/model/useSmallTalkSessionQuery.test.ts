// 세션 상세 조회 훅 검증 — 맞춤 표현은 대화가 끝난 뒤 서버가 만들어서, 준비될 때까지 다시 물어야 한다
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  ExpressionGenerationStatus,
  SmallTalkSessionDetailResponse,
} from '../api/small-talk';
import * as smallTalkApi from '../api/small-talk';
import {
  useSmallTalkSessionQuery,
  WAIT_LIMIT_MS,
} from './useSmallTalkSessionQuery';

vi.mock('../api/small-talk', () => ({
  getSmallTalkSession: vi.fn(),
  retrySmallTalkExpressions: vi.fn(),
}));

vi.mock('@/shared/monitoring/report', () => ({ reportWarning: vi.fn() }));

vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 42 } }),
}));

const getSmallTalkSession = vi.mocked(smallTalkApi.getSmallTalkSession);
const retrySmallTalkExpressions = vi.mocked(
  smallTalkApi.retrySmallTalkExpressions,
);

const sessionOf = (
  expressionGenerationStatus: ExpressionGenerationStatus,
): SmallTalkSessionDetailResponse => ({
  sessionId: 7,
  title: '카페 얘기',
  startedAt: '2026-08-13T01:00:00',
  completedAt: '2026-08-13T01:08:00',
  userSpeakingDurationMs: 161_000,
  messages: [],
  expressionGenerationStatus,
  expressionLearningStatus: 'NOT_STARTED',
  expressions: [],
  correctionCount: 0,
});

const renderSession = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderHook(() => useSmallTalkSessionQuery(7), {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children),
  });
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  // 폴링이 도는 채로 다음 테스트에 넘어가면 조회 횟수가 섞인다
  cleanup();
  vi.useRealTimers();
});

describe('useSmallTalkSessionQuery', () => {
  it('표현이 준비될 때까지 다시 묻는다', async () => {
    // Given 아직 만드는 중인 세션
    getSmallTalkSession.mockResolvedValue(sessionOf('PREPARING'));
    const { result } = renderSession();
    await waitFor(() => expect(result.current.session).not.toBeNull());

    // When 폴링 간격만큼 지나면
    // Then 다시 조회한다
    await waitFor(
      () => expect(getSmallTalkSession.mock.calls.length).toBeGreaterThan(1),
      { timeout: 3_000 },
    );
  });

  describe('교정 대기', () => {
    // 표현은 다 만들었지만 사용자 메시지 하나의 교정이 아직인 세션
    const readyButCorrecting = (): SmallTalkSessionDetailResponse => ({
      ...sessionOf('READY'),
      messages: [
        {
          messageId: 1,
          turnNumber: 1,
          messageSequence: 1,
          role: 'USER',
          content: 'Hi.',
          translatedContent: null,
          emotion: null,
          innerThought: null,
          innerThoughtType: null,
          correctionStatus: 'PREPARING',
          correction: null,
        },
      ],
    });

    const renderAwaitingCorrections = () => {
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      return renderHook(
        () => useSmallTalkSessionQuery(7, { awaitCorrections: true }),
        {
          wrapper: ({ children }: { children: ReactNode }) =>
            createElement(QueryClientProvider, { client }, children),
        },
      );
    };

    it('교정을 기다리기로 했으면 표현이 준비됐어도 교정이 끝날 때까지 다시 묻는다', async () => {
      getSmallTalkSession.mockResolvedValue(readyButCorrecting());
      const { result } = renderAwaitingCorrections();
      await waitFor(() => expect(result.current.session).not.toBeNull());

      await waitFor(
        () => expect(getSmallTalkSession.mock.calls.length).toBeGreaterThan(1),
        { timeout: 3_000 },
      );
    });

    it('교정을 기다리지 않는 화면은 교정이 남아 있어도 표현이 준비되면 그만 묻는다', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      getSmallTalkSession.mockResolvedValue(readyButCorrecting());
      const { result } = renderSession();
      await waitFor(() => expect(result.current.session).not.toBeNull());

      const callsAfterFirstLoad = getSmallTalkSession.mock.calls.length;
      await act(() => vi.advanceTimersByTimeAsync(3_000));

      expect(getSmallTalkSession).toHaveBeenCalledTimes(callsAfterFirstLoad);
    });

    it('교정만 늦어 상한을 넘겨도 표현이 준비됐으면 소용없다고 하지 않는다', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      getSmallTalkSession.mockResolvedValue(readyButCorrecting());
      const { result } = renderAwaitingCorrections();
      await waitFor(() => expect(result.current.session).not.toBeNull());

      await act(() => vi.advanceTimersByTimeAsync(WAIT_LIMIT_MS + 1_000));

      // 상한이 실제로 걸렸다 — 폴링은 멈추되, 표현은 준비됐으니 소용없다고 하지 않는다
      const callsAtLimit = getSmallTalkSession.mock.calls.length;
      await act(() => vi.advanceTimersByTimeAsync(3_000));
      expect(getSmallTalkSession).toHaveBeenCalledTimes(callsAtLimit);
      expect(result.current.waitExpired).toBe(true);
      expect(result.current.generationStuck).toBe(false);
    });
  });

  it('준비가 끝나면 그만 묻는다', async () => {
    getSmallTalkSession.mockResolvedValue(sessionOf('READY'));
    const { result } = renderSession();
    await waitFor(() => expect(result.current.session).not.toBeNull());

    const callsAfterFirstLoad = getSmallTalkSession.mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 1_500));

    expect(getSmallTalkSession).toHaveBeenCalledTimes(callsAfterFirstLoad);
  });

  it('생성에 실패하면 한 번은 조용히 다시 걸어 본다', async () => {
    // 사용자에게 버튼을 떠넘기기 전에 해볼 수 있는 일이다 — 그동안 화면은 계속 만드는 중이다
    getSmallTalkSession.mockResolvedValueOnce(sessionOf('FAILED'));
    getSmallTalkSession.mockResolvedValue(sessionOf('PREPARING'));
    retrySmallTalkExpressions.mockResolvedValue({
      sessionId: 7,
      expressionGenerationStatus: 'PREPARING',
    });
    const { result } = renderSession();

    await waitFor(() =>
      expect(retrySmallTalkExpressions).toHaveBeenCalledWith(7),
    );
    await waitFor(() =>
      expect(result.current.session?.expressionGenerationStatus).toBe(
        'PREPARING',
      ),
    );
    expect(result.current.generationStuck).toBe(false);
  });

  it('다시 걸어도 실패하면 그때 포기한다', async () => {
    // 두 번째 실패까지 확인해야 "더 기다려도 소용없다"고 말할 수 있다
    getSmallTalkSession.mockResolvedValue(sessionOf('FAILED'));
    retrySmallTalkExpressions.mockResolvedValue({
      sessionId: 7,
      expressionGenerationStatus: 'FAILED',
    });
    const { result } = renderSession();

    await waitFor(() => expect(result.current.generationStuck).toBe(true));
    expect(retrySmallTalkExpressions).toHaveBeenCalledTimes(1);
  });

  it('만드는 중에는 아직 소용없다고 하지 않는다', async () => {
    getSmallTalkSession.mockResolvedValue(sessionOf('PREPARING'));
    const { result } = renderSession();
    await waitFor(() => expect(result.current.session).not.toBeNull());

    expect(result.current.generationStuck).toBe(false);
  });
});
