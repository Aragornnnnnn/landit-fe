// useSmallTalkFlow — 스몰톡에만 있는 두 가지를 검증한다.
// (1) 남은 말하기 시간을 언제 깎고 언제 되돌리는가 (2) 종료 확인 응답 처리
// (턴 전이·속마음 같은 엔진 공통 동작은 useScenarioTalkFlow 테스트가 맡는다)
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as sessionApi from '@/features/conversation/api/session';
import { shouldAskSatisfaction } from '@/features/satisfaction/model/prompt-record';
import * as smallTalkApi from '@/features/small-talk/api/small-talk';
import type {
  SmallTalkMessageSubmitResponse,
  SmallTalkSessionStartResponse,
} from '@/features/small-talk/api/small-talk';
import { smallTalkKeys } from '@/features/small-talk/model/keys';
import type { TtsVoice } from '@/shared/tts/voice';

import { useSmallTalkFlow } from './useSmallTalkFlow';

const monitoringMock = vi.hoisted(() => ({
  reportError: vi.fn(),
  reportWarning: vi.fn(),
}));
vi.mock('@/shared/monitoring/report', () => monitoringMock);

vi.mock('@/features/conversation/api/session', () => ({
  getInnerThought: vi.fn(),
  endSession: vi.fn(),
}));

vi.mock('@/features/small-talk/api/small-talk', () => ({
  submitSmallTalkMessage: vi.fn(),
  decideSmallTalkExit: vi.fn(),
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
  useStt: (opts: { onFinal?: (t: string) => void }) => {
    sttMock.callbacks.onFinal = opts.onFinal;
    return { start: sttMock.start, stop: sttMock.stop, abort: sttMock.abort };
  },
}));

// 로그인 상태는 쿼리 키에만 쓰인다 — 스토어를 통째로 목으로 둔다
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 39 } }),
}));

// 스트릭 미리받기는 경계라 목으로 둔다 — 여기서는 완료 때 부르는지만 본다
const refreshStreak = vi.hoisted(() => vi.fn());
vi.mock('@/features/streak/model/refresh-streak', () => ({
  refreshStreakAfterCompletion: refreshStreak,
}));

const queryClientMock = vi.hoisted(() => ({ invalidateQueries: vi.fn() }));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => queryClientMock,
}));

const submitSmallTalkMessage = vi.mocked(smallTalkApi.submitSmallTalkMessage);
const decideSmallTalkExit = vi.mocked(smallTalkApi.decideSmallTalkExit);
const getInnerThought = vi.mocked(sessionApi.getInnerThought);

// 세션이 내려준 목소리 — 파트너 프로필 값과 다르게 둬서 어느 쪽을 쓰는지 구분한다
const sessionVoice: TtsVoice = {
  provider: 'OPENROUTER',
  model: 'deepgram/aura-2',
  providerVoiceId: 'session-voice-for-test',
  gender: 'FEMALE',
};

// 내가 먼저 거는 대화 — 말하기 대기(USER_READY)에서 시작한다
const session = {
  sessionId: 7,
  startMode: 'USER_FIRST',
  title: null,
  speakingTimeLimitMs: 60_000,
  ttsVoice: sessionVoice,
  currentMessage: null,
} as unknown as SmallTalkSessionStartResponse;

const progress = (remainingSpeakingTimeMs: number) => ({
  sessionStatus: 'IN_PROGRESS' as const,
  accumulatedSpeakingDurationMs: 5_000,
  speakingTimeLimitMs: 60_000,
  usedSpeakingTimeMs: 60_000 - remainingSpeakingTimeMs,
  remainingSpeakingTimeMs,
  expressionGenerationStatus: 'PREPARING' as const,
});

const submitResponse = (
  over: Partial<SmallTalkMessageSubmitResponse> = {},
): SmallTalkMessageSubmitResponse =>
  ({
    sessionId: 7,
    title: null,
    turnStatus: 'CONTINUE',
    submittedMessage: {
      messageId: 100,
      turnNumber: 1,
      messageSequence: 1,
      role: 'USER',
      feedbackProcessingStatus: 'COMPLETED',
      innerThoughtProcessingStatus: 'COMPLETED',
      innerThought: '반갑네',
      innerThoughtType: 'NORMAL',
    },
    nextMessage: {
      messageId: 101,
      turnNumber: 2,
      messageSequence: 2,
      role: 'AI',
      content: 'Nice!',
      translatedContent: '좋다!',
    },
    progress: progress(12_000),
    ...over,
  }) as SmallTalkMessageSubmitResponse;

const goHome = vi.fn();

const renderFlow = (remainingSpeakingTimeMs = 20_000) =>
  renderHook(() =>
    useSmallTalkFlow({
      session,
      partner: 'chloe',
      remainingSpeakingTimeMs,
      endSession: vi.fn(),
      goHome,
    }),
  );

// 마이크를 켜고 seconds초 동안 말한다 (눈금은 1초에 한 칸씩 깎인다)
const speakFor = (
  result: { current: ReturnType<typeof useSmallTalkFlow> },
  seconds: number,
) => {
  act(() => result.current.input.pressMic());
  act(() => vi.advanceTimersByTime(seconds * 1000));
};

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  getInnerThought.mockResolvedValue({
    processingStatus: 'COMPLETED',
    innerThought: '반갑네',
    innerThoughtType: 'NORMAL',
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useSmallTalkFlow — 남은 말하기 시간', () => {
  it('말하는 동안 1초에 한 칸씩 줄어든다', () => {
    const { result } = renderFlow(20_000);

    speakFor(result, 5);

    expect(result.current.remainingMs).toBe(15_000);
  });

  it('타이머 링은 이번 발화에서 남은 몫을 그린다', () => {
    const { result } = renderFlow(20_000);

    expect(result.current.speakingRatio).toBe(1); // 말하기 전에는 가득 차 있다
    speakFor(result, 5);

    expect(result.current.speakingRatio).toBe(0.75);
  });

  it('시간을 다 쓴 채로 시작한 발화는 빈 링으로 그린다', () => {
    // 잔량 0이 "값이 없음"으로 새면 다 쓴 자리에서 링이 가득 찬 채로 뜬다
    const { result } = renderFlow(0);

    act(() => result.current.input.pressMic());

    expect(result.current.speakingRatio).toBe(0);
  });

  it('말하다 취소하면 말하기 전 값으로 되돌아온다', () => {
    // 보낸 말이 없으면 서버도 안 깎는다 — 화면만 깎인 채로 두면 다음 제출에서 시간이 되살아난다
    const { result } = renderFlow(20_000);

    speakFor(result, 5);
    act(() => result.current.input.cancelInput());

    expect(result.current.remainingMs).toBe(20_000);
  });

  it('말이 인식되지 않아도 되돌아온다', () => {
    // 취소만 되돌리면 "말했는데 인식이 안 됐다"가 그대로 새어나간다
    const { result } = renderFlow(20_000);

    speakFor(result, 5);
    act(() => result.current.input.finishListening());
    act(() => sttMock.callbacks.onFinal?.('   '));

    expect(result.current.remainingMs).toBe(20_000);
  });

  it('제출이 실패해도 되돌아온다', async () => {
    // 서버가 받지 못했으면 차감도 없다
    submitSmallTalkMessage.mockRejectedValueOnce(new Error('503'));
    const { result } = renderFlow(20_000);

    speakFor(result, 5);
    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('Hello there.');
    });

    expect(result.current.remainingMs).toBe(20_000);
  });

  it('제출이 성공하면 서버가 정산한 값으로 맞춘다', async () => {
    // 화면의 1초 눈금은 어림값이다 — 정본은 서버가 준 잔량이다
    submitSmallTalkMessage.mockResolvedValueOnce(submitResponse());
    const { result } = renderFlow(20_000);

    speakFor(result, 5);
    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('Hello there.');
    });

    expect(result.current.remainingMs).toBe(12_000);
  });

  it('발화 합성 목소리는 세션 응답의 ttsVoice를 쓴다', async () => {
    // 캐릭터별 목소리는 서버(conversation_character)가 정본이다 — 파트너 프로필 하드코딩이 아니라
    submitSmallTalkMessage.mockResolvedValueOnce(submitResponse());
    const { result } = renderFlow(20_000);

    speakFor(result, 5);
    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('Hello there.');
    });

    expect(ttsMock.prefetch).toHaveBeenCalledWith('Nice!', sessionVoice);
  });

  it('말한 시간을 제출에 실어 보낸다 — 이 값으로 서버가 깎는다', async () => {
    submitSmallTalkMessage.mockResolvedValueOnce(submitResponse());
    const { result } = renderFlow(20_000);

    speakFor(result, 5);
    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('Hello there.');
    });

    expect(submitSmallTalkMessage).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        content: 'Hello there.',
        inputType: 'VOICE',
        utteranceDurationMs: 5_000,
        timeLimitReached: false,
      }),
    );
  });

  it('시간이 0이 돼도 말을 끊지 않고, 다 썼다고 알린다', async () => {
    // 시작한 발화는 끝까지 간다 — 서버도 초과분을 받아 주고 그 턴을 작별 인사로 닫는다
    submitSmallTalkMessage.mockResolvedValueOnce(
      submitResponse({ turnStatus: 'COMPLETED', progress: progress(0) }),
    );
    const { result } = renderFlow(3_000);

    speakFor(result, 10);
    expect(result.current.remainingMs).toBe(0);

    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('Bye!');
    });

    expect(submitSmallTalkMessage).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        utteranceDurationMs: 10_000,
        timeLimitReached: true,
      }),
    );
  });

  it('대화가 완료되면 스몰톡 탭에서 소감을 물을 차례라고 남긴다', async () => {
    submitSmallTalkMessage.mockResolvedValueOnce(
      submitResponse({ turnStatus: 'COMPLETED' }),
    );
    const { result } = renderFlow(30_000);
    speakFor(result, 3);

    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('Bye!');
    });

    expect(shouldAskSatisfaction('smalltalk')).toBe(true);
  });

  it('대화가 안 끝났으면 소감을 물을 차례가 아니다', async () => {
    const { result } = renderFlow(30_000);
    speakFor(result, 3);

    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('Hello!');
    });

    expect(shouldAskSatisfaction('smalltalk')).toBe(false);
  });
});

describe('useSmallTalkFlow — 중도 이탈', () => {
  it('나가면 세션을 정리하고 홈의 남은 시간을 다시 받게 한다', async () => {
    // 여기까지 주고받은 발화도 시간을 썼다 — 캐시가 옛 숫자를 30초 동안 신선하다고 본다
    submitSmallTalkMessage.mockResolvedValueOnce(submitResponse());
    const endSession = vi.fn();
    const { result } = renderHook(() =>
      useSmallTalkFlow({
        session,
        partner: 'chloe',
        remainingSpeakingTimeMs: 20_000,
        endSession,
        goHome,
      }),
    );

    speakFor(result, 5);
    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('Hello there.');
    });
    act(() => result.current.leave());

    expect(endSession).toHaveBeenCalled();
    expect(queryClientMock.invalidateQueries).toHaveBeenCalledWith({
      queryKey: smallTalkKeys.main(39),
    });
  });
});

describe('useSmallTalkFlow — 종료 확인', () => {
  const requiresExit = submitResponse({
    turnStatus: 'EXIT_CONFIRMATION_REQUIRED',
    nextMessage: null,
  });

  it('종료 확인이 오면 되묻지 않고 END로 답한다', async () => {
    // 작별 인사를 한 사람에게 정말 끝낼 거냐고 다시 묻지 않는다 — CONTINUE는 보낼 일이 없다
    submitSmallTalkMessage.mockResolvedValueOnce(requiresExit);
    decideSmallTalkExit.mockResolvedValueOnce(
      submitResponse({ turnStatus: 'COMPLETED' }),
    );
    const { result } = renderFlow();

    speakFor(result, 3);
    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('I should get going.');
    });

    expect(decideSmallTalkExit).toHaveBeenCalledWith(7, {
      submittedMessageId: 100,
      decision: 'END',
    });
    expect(result.current.phase).not.toBe('USER_READY');
    // 축하 화면이 옛 숫자를 그리지 않게 스트릭을 미리 받아 둔다
    expect(refreshStreak).toHaveBeenCalled();
  });

  it('그 답을 보내지 못하면 대화를 나가는 것으로 정리한다', async () => {
    // 세션은 답을 기다리는 상태로 남는다 — 화면만 되돌리면 다시 말해도 제출이 막힌다
    submitSmallTalkMessage.mockResolvedValueOnce(requiresExit);
    decideSmallTalkExit.mockRejectedValueOnce(new Error('500'));
    const endSession = vi.fn();
    const { result } = renderHook(() =>
      useSmallTalkFlow({
        session,
        partner: 'chloe',
        remainingSpeakingTimeMs: 20_000,
        endSession,
        goHome,
      }),
    );

    speakFor(result, 3);
    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('I should get going.');
    });

    expect(endSession).toHaveBeenCalled();
    expect(goHome).toHaveBeenCalled();
  });
});
