// useRoleplayTalkFlow — 롤플레이에만 있는 것을 검증한다.
// (1) 속마음 없이 다음 발화로 넘어간다 (2) 끝내는 길은 X와 시간 소진뿐이다 (3) 끝내면 축하가 붙은 요약으로 간다
// (턴 전이·발화 예산 같은 공통 동작은 useScenarioTalkFlow·useSmallTalkFlow 테스트가 맡는다)
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as sessionApi from '@/features/conversation/api/session';
import * as roleplayApi from '@/features/roleplay/api/roleplay';
import type {
  RoleplayMessageSubmitResponse,
  RoleplaySessionStartResponse,
} from '@/features/roleplay/api/roleplay';
import { roleplayKeys } from '@/features/roleplay/model/keys';
import { ApiError } from '@/shared/api/api-error';
import type { SttResultMeta } from '@/shared/stt/deepgram-stt';

import { useRoleplayTalkFlow } from './useRoleplayTalkFlow';

const STT_META: SttResultMeta = {
  engine: 'deepgram',
  endReason: 'finalize',
  connectMs: 0,
  finalizeWaitMs: 0,
};

const monitoringMock = vi.hoisted(() => ({
  reportError: vi.fn(),
  reportWarning: vi.fn(),
}));
vi.mock('@/shared/monitoring/report', () => monitoringMock);

vi.mock('@/features/conversation/api/session', () => ({
  getInnerThought: vi.fn(),
}));

vi.mock('@/features/roleplay/api/roleplay', () => ({
  submitRoleplayMessage: vi.fn(),
  completeRoleplaySession: vi.fn(),
  getRoleplaySummary: vi.fn(),
}));

// TTS·STT는 경계라 목으로 둔다 — 재생 종료와 인식 결과만 흉내 낸다
const ttsMock = vi.hoisted(() => ({
  state: { onEnd: undefined as (() => void) | undefined },
  speak: vi.fn((_t: string, _v: unknown, opts?: { onEnd?: () => void }) => {
    ttsMock.state.onEnd = opts?.onEnd;
    return Promise.resolve();
  }),
  speakSrc: vi.fn(),
  prefetch: vi.fn(() => Promise.resolve()),
  prefetchSrc: vi.fn(),
  stop: vi.fn(),
}));
vi.mock('@/shared/tts/useTts', () => ({
  useTts: () => ({
    speak: ttsMock.speak,
    speakSrc: ttsMock.speakSrc,
    prefetch: ttsMock.prefetch,
    prefetchSrc: ttsMock.prefetchSrc,
    stop: ttsMock.stop,
    status: 'idle',
  }),
}));

const sttMock = vi.hoisted(() => ({
  callbacks: { onFinal: undefined as ((t: string) => void) | undefined },
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
}));
vi.mock('@/shared/stt/useStt', () => ({
  useStt: (opts: { onFinal?: (t: string, meta: SttResultMeta) => void }) => {
    sttMock.callbacks.onFinal = (t: string) => opts.onFinal?.(t, STT_META);
    return { start: sttMock.start, stop: sttMock.stop, abort: sttMock.abort };
  },
}));

vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 39 } }),
}));

const refreshStreak = vi.hoisted(() => vi.fn());
vi.mock('@/features/streak/model/refresh-streak', () => ({
  refreshStreakAfterCompletion: refreshStreak,
}));

const queryClientMock = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  prefetchQuery: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => queryClientMock,
}));

const submitRoleplayMessage = vi.mocked(roleplayApi.submitRoleplayMessage);
const completeRoleplaySession = vi.mocked(roleplayApi.completeRoleplaySession);
const getInnerThought = vi.mocked(sessionApi.getInnerThought);

const toastMock = vi.hoisted(() => vi.fn());
vi.mock('@/shared/ui/toast', () => ({ showToast: toastMock }));

// 상대가 늘 먼저 말을 건다 — 첫 발화를 듣고 나서야 말할 차례가 된다
const session = {
  sessionId: 7,
  sessionType: 'ROLEPLAY',
  title: '카페에서 커피 주문하기',
  character: { characterId: 'chloe', ttsVoice: null },
  speakingTimeLimitMs: 60_000,
  usage: {
    usageDate: '2026-11-01',
    usedSpeakingDurationMs: 0,
    remainingMs: 60_000,
  },
  currentMessage: {
    messageId: 1,
    turnNumber: 1,
    messageSequence: 1,
    role: 'AI',
    content: 'Hi! What can I get you?',
    translatedContent: '안녕하세요! 뭐 드릴까요?',
    emotion: null,
  },
} as unknown as RoleplaySessionStartResponse;

const submitResponse = (
  over: Partial<RoleplayMessageSubmitResponse> = {},
): RoleplayMessageSubmitResponse => ({
  sessionId: 7,
  title: '카페에서 커피 주문하기',
  turnStatus: 'CONTINUE',
  submittedMessage: {
    messageId: 100,
    turnNumber: 1,
    messageSequence: 2,
    role: 'USER',
  },
  nextMessage: {
    messageId: 101,
    turnNumber: 2,
    messageSequence: 3,
    role: 'AI',
    content: 'Sure, hot or iced?',
    translatedContent: '네, 따뜻한 걸로요 차가운 걸로요?',
    emotion: null,
  },
  progress: {
    sessionStatus: 'IN_PROGRESS',
    accumulatedSpeakingDurationMs: 3_000,
    speakingTimeLimitMs: 60_000,
    usedSpeakingTimeMs: 3_000,
    remainingSpeakingTimeMs: 57_000,
  },
  ...over,
});

const goHome = vi.fn();
const showSummary = vi.fn();

const renderFlow = async () => {
  const rendered = renderHook(() =>
    useRoleplayTalkFlow({
      session,
      partner: 'chloe',
      goHome,
      showSummary,
    }),
  );
  // 상대의 첫 마디가 끝나야 말할 차례다
  await act(async () => ttsMock.state.onEnd?.());
  await act(async () => vi.advanceTimersByTime(3_000));
  return rendered;
};

type Flow = { current: ReturnType<typeof useRoleplayTalkFlow> };

// 마이크로 한 마디 하고 확인 단계에서 그대로 보낸다
const sayOnce = async (result: Flow, text = 'A latte, please.') => {
  act(() => result.current.input.pressMic());
  act(() => vi.advanceTimersByTime(3_000));
  await act(async () => {
    result.current.input.finishListening();
    sttMock.callbacks.onFinal?.(text);
  });
  await act(async () => result.current.input.submitReviewed());
};

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  submitRoleplayMessage.mockReset();
  completeRoleplaySession.mockReset();
});

describe('useRoleplayTalkFlow — 발화 제출', () => {
  it('보낸 말에 재전송 식별자와 말한 시간을 싣는다', async () => {
    submitRoleplayMessage.mockResolvedValueOnce(submitResponse());
    const { result } = await renderFlow();

    await sayOnce(result);

    expect(submitRoleplayMessage).toHaveBeenCalledWith(7, {
      clientMessageId: expect.any(String),
      content: 'A latte, please.',
      inputType: 'VOICE',
      utteranceDurationMs: expect.any(Number),
    });
  });

  it('속마음을 기다리지 않고 상대의 다음 말로 넘어간다', async () => {
    submitRoleplayMessage.mockResolvedValueOnce(submitResponse());
    const { result } = await renderFlow();

    await sayOnce(result);
    await act(async () => vi.advanceTimersByTime(5_000));

    expect(getInnerThought).not.toHaveBeenCalled();
    expect(result.current.turn.aiMessage).toBe('Sure, hot or iced?');
  });

  it('다른 곳에서 먼저 끝낸 대화면(COMPLETED) 이어가지 않고 요약으로 보낸다', async () => {
    submitRoleplayMessage.mockResolvedValueOnce(
      submitResponse({ turnStatus: 'COMPLETED', nextMessage: null }),
    );
    const { result } = await renderFlow();

    await sayOnce(result);

    expect(refreshStreak).toHaveBeenCalled();
    expect(queryClientMock.prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: roleplayKeys.summary(39, 7) }),
    );
    expect(showSummary).toHaveBeenCalled();
    expect(completeRoleplaySession).not.toHaveBeenCalled();
  });

  it('오늘 말할 시간을 다 썼다고 거절되면 알리고 대화를 끝내 요약으로 보낸다', async () => {
    submitRoleplayMessage.mockRejectedValueOnce(
      new ApiError(
        'limit',
        409,
        '/api/v1/roleplays/sessions/7/messages',
        'FREE_TALK_DAILY_SPEAKING_LIMIT_EXCEEDED',
      ),
    );
    completeRoleplaySession.mockResolvedValueOnce(undefined);
    const { result } = await renderFlow();

    await sayOnce(result);

    expect(toastMock).toHaveBeenCalled();
    expect(completeRoleplaySession).toHaveBeenCalledWith(7);
    expect(showSummary).toHaveBeenCalled();
  });

  it('발화를 받은 뒤 스몰톡 홈의 남은 시간을 다시 받게 한다 — 하루 시간을 같이 쓴다', async () => {
    submitRoleplayMessage.mockResolvedValueOnce(submitResponse());
    const { result } = await renderFlow();

    await sayOnce(result);

    expect(queryClientMock.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['small-talk', 39, 'main'],
    });
  });
});

describe('useRoleplayTalkFlow — X 누르기', () => {
  it('아직 한 마디도 안 했으면 묻지 않고 한 번만 나간다 — 서버엔 아무것도 보내지 않는다', async () => {
    const { result } = await renderFlow();

    let confirm: boolean | undefined;
    act(() => {
      confirm = result.current.pressClose();
      result.current.pressClose();
    });

    expect(confirm).toBe(false);
    expect(goHome).toHaveBeenCalledTimes(1);
    expect(completeRoleplaySession).not.toHaveBeenCalled();
  });

  it('첫 마디를 보내고 응답을 기다리는 중이어도 끝내기 시트로 물어본다 — 서버는 이미 그 말을 받았다', async () => {
    submitRoleplayMessage.mockReturnValueOnce(new Promise(() => {}));
    const { result } = await renderFlow();
    await sayOnce(result);

    let confirm: boolean | undefined;
    act(() => {
      confirm = result.current.pressClose();
    });

    expect(confirm).toBe(true);
    expect(goHome).not.toHaveBeenCalled();
  });

  it('주고받은 말이 있으면 끝내기 시트로 물어본다', async () => {
    submitRoleplayMessage.mockResolvedValueOnce(submitResponse());
    const { result } = await renderFlow();
    await sayOnce(result);

    let confirm: boolean | undefined;
    act(() => {
      confirm = result.current.pressClose();
    });

    expect(confirm).toBe(true);
  });
});

describe('useRoleplayTalkFlow — 끝내고 피드백 보기', () => {
  it('완료를 요청하고 요약으로 보낸다', async () => {
    submitRoleplayMessage.mockResolvedValueOnce(submitResponse());
    completeRoleplaySession.mockResolvedValueOnce(undefined);
    const { result } = await renderFlow();
    await sayOnce(result);

    await act(async () => result.current.completeTalk());

    expect(completeRoleplaySession).toHaveBeenCalledWith(7);
    expect(showSummary).toHaveBeenCalled();
    expect(refreshStreak).toHaveBeenCalled();
  });

  it('완료 요청이 실패하면 알리고 홈으로 간다', async () => {
    submitRoleplayMessage.mockResolvedValueOnce(submitResponse());
    completeRoleplaySession.mockRejectedValueOnce(new Error('500'));
    const { result } = await renderFlow();
    await sayOnce(result);

    await act(async () => result.current.completeTalk());

    expect(monitoringMock.reportError).toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalled();
    expect(goHome).toHaveBeenCalled();
    expect(showSummary).not.toHaveBeenCalled();
  });

  it('완료한 뒤 늦게 도착한 발화 결과로 대화를 잇지 않는다', async () => {
    completeRoleplaySession.mockResolvedValueOnce(undefined);
    submitRoleplayMessage.mockResolvedValueOnce(submitResponse());
    const { result } = await renderFlow();
    await sayOnce(result);
    await act(async () => vi.advanceTimersByTime(5_000));
    await act(async () => ttsMock.state.onEnd?.());
    await act(async () => vi.advanceTimersByTime(3_000));
    let resolveLate!: (res: RoleplayMessageSubmitResponse) => void;
    submitRoleplayMessage.mockReturnValueOnce(
      new Promise((resolve) => (resolveLate = resolve)),
    );
    await sayOnce(result, 'Iced, please.');

    await act(async () => result.current.completeTalk());
    await act(async () =>
      resolveLate(submitResponse({ turnStatus: 'COMPLETED' })),
    );

    // 완료 후속은 직접 완료 한 번뿐이다
    expect(refreshStreak).toHaveBeenCalledTimes(1);
  });
});
