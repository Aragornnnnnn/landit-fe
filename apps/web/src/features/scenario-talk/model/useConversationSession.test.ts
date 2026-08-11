// 대화 세션 수명 훅 검증 — 백그라운드 1회 시작, 확보 대기(ensure), 오프닝 폴백, 중도 종료
import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as sessionApi from '@/entities/conversation/api/session';
import * as scenarioTalkApi from '@/features/scenario-talk/api/session';
import type { Scenario } from '@/features/scenario/lib/to-scenario';

import { useConversationSession } from './useConversationSession';

vi.mock('@/entities/conversation/api/session', () => ({
  endSession: vi.fn(),
}));

vi.mock('@/features/scenario-talk/api/session', () => ({
  startSession: vi.fn(),
}));

const monitoringMock = vi.hoisted(() => ({
  reportError: vi.fn(),
  reportWarning: vi.fn(),
}));
vi.mock('@/shared/monitoring/report', () => monitoringMock);

const startSession = vi.mocked(scenarioTalkApi.startSession);
const endSession = vi.mocked(sessionApi.endSession);

const scenario = {
  scenarioId: 10,
  firstSpeaker: 'AI',
  completed: false,
} as unknown as Scenario;

const startResponse = (
  currentMessage: { content: string; translatedContent: string | null } | null,
) =>
  ({
    sessionId: 7,
    currentMessage,
    progress: { completed: false },
  }) as Awaited<ReturnType<typeof scenarioTalkApi.startSession>>;

const renderSession = (
  onOpeningMessage: (message: {
    content: string;
    translatedContent: string | null;
  }) => void = () => {},
) => renderHook(() => useConversationSession(scenario, { onOpeningMessage }));

beforeEach(() => {
  startSession.mockReset();
  endSession.mockReset();
  startSession.mockResolvedValue(startResponse(null));
  endSession.mockResolvedValue(undefined as never);
});

describe('useConversationSession', () => {
  it('백그라운드로 세션을 시작하고 확보된 sessionId를 노출한다', async () => {
    const { result } = renderSession();

    await act(async () => {});

    expect(result.current.sessionId).toBe(7);
  });

  it('StrictMode 재마운트에도 세션은 한 번만 만든다', async () => {
    renderHook(
      () => useConversationSession(scenario, { onOpeningMessage: () => {} }),
      { wrapper: StrictMode },
    );

    await act(async () => {});

    expect(startSession).toHaveBeenCalledTimes(1);
  });

  it('ensure는 시작이 끝나기 전에 불려도 확보를 기다렸다가 sessionId를 돌려준다', async () => {
    let resolve!: (value: ReturnType<typeof startResponse>) => void;
    startSession.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { result } = renderSession();

    let ensured: Promise<number | null>;
    act(() => {
      ensured = result.current.ensure(); // 시작이 아직 진행 중
    });
    await act(async () => {
      resolve(startResponse(null)); // 뒤늦게 확보 완료
    });

    await expect(ensured!).resolves.toBe(7);
  });

  it('시작이 실패하면 ensure는 null을 준다 (화면은 계속 뜬다)', async () => {
    startSession.mockRejectedValue(new Error('boom'));
    const { result } = renderSession();
    await act(async () => {});

    await expect(result.current.ensure()).resolves.toBeNull();
    expect(result.current.sessionId).toBeNull();
  });

  it('시작 실패를 Sentry로 보고한다 — 이후 모든 제출이 막히는 사고라 바로 알아야 한다', async () => {
    const error = new Error('boom');
    startSession.mockRejectedValue(error);
    renderSession();
    await act(async () => {});

    expect(monitoringMock.reportError).toHaveBeenCalledWith(error);
  });

  it('세션 응답에 첫 발화가 있으면 오프닝 폴백으로 알려준다', async () => {
    const onOpeningMessage = vi.fn();
    startSession.mockResolvedValue(
      startResponse({ content: 'Hello!', translatedContent: '안녕!' }),
    );

    renderSession(onOpeningMessage);
    await act(async () => {});

    expect(onOpeningMessage).toHaveBeenCalledWith({
      content: 'Hello!',
      translatedContent: '안녕!',
    });
  });

  it('첫 발화가 없으면 오프닝 폴백을 부르지 않는다', async () => {
    const onOpeningMessage = vi.fn();

    renderSession(onOpeningMessage);
    await act(async () => {});

    expect(onOpeningMessage).not.toHaveBeenCalled();
  });

  it('end는 확보된 세션만 종료한다', async () => {
    const { result } = renderSession();
    await act(async () => {});

    act(() => result.current.end());

    expect(endSession).toHaveBeenCalledWith(7);
  });

  it('종료 실패를 Sentry에 warning으로 보고한다 — 유저는 이미 나갔으니 알림까진 필요 없다', async () => {
    const error = new Error('boom');
    endSession.mockRejectedValue(error);
    const { result } = renderSession();
    await act(async () => {});

    act(() => result.current.end());
    await act(async () => {});

    expect(monitoringMock.reportWarning).toHaveBeenCalledWith(error);
  });

  it('세션이 확보되기 전의 end는 아무것도 부르지 않는다', async () => {
    startSession.mockReturnValue(new Promise(() => {})); // 영원히 시작 중
    const { result } = renderSession();

    act(() => result.current.end());

    expect(endSession).not.toHaveBeenCalled();
  });
});
