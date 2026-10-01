// useSmallTalkFlow — 스몰톡에만 있는 두 가지를 검증한다.
// (1) 남은 말하기 시간을 언제 깎고 언제 되돌리는가 (2) 종료 확인 응답 처리 (3) 종료 버튼으로 직접 완료
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
  completeSmallTalkSession: vi.fn(),
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

const queryClientMock = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  // 완료 턴이 다음 화면(오늘의 스몰톡) 요약을 미리 받아 둔다 — 받았는지만 본다
  prefetchQuery: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => queryClientMock,
}));

const submitSmallTalkMessage = vi.mocked(smallTalkApi.submitSmallTalkMessage);
const decideSmallTalkExit = vi.mocked(smallTalkApi.decideSmallTalkExit);
const completeSmallTalkSession = vi.mocked(
  smallTalkApi.completeSmallTalkSession,
);
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
  character: { characterId: 'marco', ttsVoice: sessionVoice },
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
const showSummary = vi.fn();

const renderFlow = (remainingSpeakingTimeMs = 20_000, endSession = vi.fn()) =>
  renderHook(() =>
    useSmallTalkFlow({
      session,
      partner: 'chloe',
      remainingSpeakingTimeMs,
      endSession,
      goHome,
      showSummary,
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
  vi.clearAllMocks();
  // 한 번만 쓰라고 걸어 둔 응답이 남으면 다음 테스트로 샌다 — API 목은 통째로 비운다
  submitSmallTalkMessage.mockReset();
  decideSmallTalkExit.mockReset();
  completeSmallTalkSession.mockReset();
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
        showSummary,
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
    // 작별 인사를 듣는 동안 오늘의 스몰톡 요약이 도착하게 미리 받아 둔다
    expect(queryClientMock.prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: smallTalkKeys.summary(39, 7) }),
    );
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
        showSummary,
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

describe('useSmallTalkFlow — 종료 버튼으로 직접 완료', () => {
  // 한 마디를 주고받아 서버가 발화를 받아 둔 상태로 만든다
  const exchangeOnce = async (result: {
    current: ReturnType<typeof useSmallTalkFlow>;
  }) => {
    submitSmallTalkMessage.mockResolvedValueOnce(submitResponse());
    speakFor(result, 3);
    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('Hello there.');
    });
  };

  // 속마음과 상대 발화가 끝나 다시 말할 차례(USER_READY)가 될 때까지 넘긴다
  const untilUserReady = async (result: {
    current: ReturnType<typeof useSmallTalkFlow>;
  }) => {
    await act(async () => vi.advanceTimersByTime(10_000));
    await act(async () => ttsMock.state.onEnd?.());
    await act(async () => vi.advanceTimersByTime(3_000));
  };

  it('주고받은 말이 있으면 완료를 요청하고 오늘의 스몰톡으로 보낸다', async () => {
    completeSmallTalkSession.mockResolvedValueOnce(undefined);
    const endSession = vi.fn();
    const { result } = renderFlow(20_000, endSession);
    await exchangeOnce(result);

    await act(async () => result.current.completeTalk());

    expect(completeSmallTalkSession).toHaveBeenCalledWith(7);
    expect(showSummary).toHaveBeenCalled();
    // 중도 종료가 아니다 — 세션을 INTERRUPTED로 끝내면 요약을 못 본다
    expect(endSession).not.toHaveBeenCalled();
    // 작별 완료와 같은 후속 — 스트릭·요약을 미리 받고 소감 차례를 남긴다
    expect(refreshStreak).toHaveBeenCalled();
    expect(queryClientMock.prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: smallTalkKeys.summary(39, 7) }),
    );
    expect(shouldAskSatisfaction('smalltalk')).toBe(true);
  });

  it('완료 요청이 실패하면 중도 종료로 정리하고 홈으로 간다', async () => {
    completeSmallTalkSession.mockRejectedValueOnce(new Error('500'));
    const endSession = vi.fn();
    const { result } = renderFlow(20_000, endSession);
    await exchangeOnce(result);

    await act(async () => result.current.completeTalk());

    expect(monitoringMock.reportError).toHaveBeenCalled();
    expect(endSession).toHaveBeenCalled();
    expect(goHome).toHaveBeenCalled();
    expect(showSummary).not.toHaveBeenCalled();
  });

  it('완료한 뒤 늦게 도착한 발화 결과로 완료 후속을 다시 하지 않는다', async () => {
    // 서버는 직접 완료 뒤 도착한 발화에 COMPLETED를 돌려줄 수 있다 — 완료가 두 번 세지면 안 된다
    completeSmallTalkSession.mockResolvedValueOnce(undefined);
    const { result } = renderFlow(20_000);
    await exchangeOnce(result);
    let resolveLate!: (res: SmallTalkMessageSubmitResponse) => void;
    submitSmallTalkMessage.mockReturnValueOnce(
      new Promise((resolve) => (resolveLate = resolve)),
    );
    await untilUserReady(result);
    speakFor(result, 2);
    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('And you?');
    });

    await act(async () => result.current.completeTalk());
    refreshStreak.mockClear();
    await act(async () =>
      resolveLate(
        submitResponse({ turnStatus: 'COMPLETED', nextMessage: null }),
      ),
    );

    expect(refreshStreak).not.toHaveBeenCalled();
  });

  it('작별 인사로 이미 끝난 대화면 완료를 다시 보내지 않고 오늘의 스몰톡으로 간다', async () => {
    // 끝난 화면에서 X로 들어와도 완료가 두 번 세지면 안 된다
    submitSmallTalkMessage.mockResolvedValueOnce(
      submitResponse({ turnStatus: 'COMPLETED' }),
    );
    const { result } = renderFlow(20_000);
    speakFor(result, 3);
    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('Bye!');
    });
    refreshStreak.mockClear();

    await act(async () => result.current.completeTalk());

    expect(completeSmallTalkSession).not.toHaveBeenCalled();
    expect(refreshStreak).not.toHaveBeenCalled();
    expect(showSummary).toHaveBeenCalled();
  });

  it('말하는 중에 종료하면 녹음을 취소한다', async () => {
    completeSmallTalkSession.mockResolvedValueOnce(undefined);
    const { result } = renderFlow(20_000);
    await exchangeOnce(result);
    // 첫 턴 뒤 한 번, 종료 확인을 받을 둘째 턴을 위해 한 번 더 말할 차례로 넘긴다
    await untilUserReady(result);
    await untilUserReady(result);
    speakFor(result, 2);
    expect(result.current.phase).toBe('USER_SPEAKING');

    await act(async () => result.current.completeTalk());

    expect(sttMock.abort).toHaveBeenCalled();
  });

  it('완료 요청을 기다리는 동안에는 새 발화를 서버에 보내지 않는다', async () => {
    // 시트를 닫고 다시 말해도 이미 끝내기로 한 대화다
    completeSmallTalkSession.mockReturnValueOnce(new Promise(() => {}));
    const { result } = renderFlow(20_000);
    await exchangeOnce(result);
    await untilUserReady(result);
    submitSmallTalkMessage.mockClear();

    act(() => void result.current.completeTalk());
    speakFor(result, 2);
    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('Wait, one more thing.');
    });

    expect(submitSmallTalkMessage).not.toHaveBeenCalled();
  });

  it('완료한 뒤 종료 확인 답이 늦게 실패해도 홈으로 되돌리지 않는다', async () => {
    // 서버는 이미 완료한 세션의 종료 확인을 에러로 돌려준다 — 요약에 간 사람을 홈으로 튕기면 안 된다
    completeSmallTalkSession.mockResolvedValueOnce(undefined);
    const endSession = vi.fn();
    const { result } = renderFlow(20_000, endSession);
    await exchangeOnce(result);
    await untilUserReady(result);
    submitSmallTalkMessage.mockResolvedValueOnce(
      submitResponse({
        turnStatus: 'EXIT_CONFIRMATION_REQUIRED',
        nextMessage: null,
      }),
    );
    let rejectDecision!: (cause: Error) => void;
    decideSmallTalkExit.mockReturnValueOnce(
      new Promise((_, reject) => (rejectDecision = reject)),
    );
    speakFor(result, 2);
    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('I should get going.');
    });

    await act(async () => result.current.completeTalk());
    await act(async () => rejectDecision(new Error('409')));

    expect(showSummary).toHaveBeenCalled();
    expect(goHome).not.toHaveBeenCalled();
    expect(endSession).not.toHaveBeenCalled();
  });

  it('완료 요청 뒤 발화 제출이 실패해도 전송 실패로 알리지 않는다', async () => {
    completeSmallTalkSession.mockResolvedValueOnce(undefined);
    const { result } = renderFlow(20_000);
    await exchangeOnce(result);
    await untilUserReady(result);
    let rejectSubmit!: (cause: Error) => void;
    submitSmallTalkMessage.mockReturnValueOnce(
      new Promise((_, reject) => (rejectSubmit = reject)),
    );
    speakFor(result, 2);
    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('And you?');
    });
    expect(submitSmallTalkMessage).toHaveBeenCalledTimes(2);
    monitoringMock.reportError.mockClear();

    await act(async () => result.current.completeTalk());
    await act(async () => rejectSubmit(new Error('409')));

    expect(monitoringMock.reportError).not.toHaveBeenCalled();
  });
});

describe('useSmallTalkFlow — X 누르기', () => {
  it('아직 주고받은 말이 없으면 확인 없이 한 번만 나간다', () => {
    // 빠르게 두 번 눌러도 중도 종료는 한 번만 보낸다
    const endSession = vi.fn();
    const { result } = renderFlow(20_000, endSession);

    let confirm: boolean | undefined;
    act(() => {
      confirm = result.current.pressClose();
      result.current.pressClose();
    });

    expect(confirm).toBe(false);
    expect(endSession).toHaveBeenCalledTimes(1);
    expect(goHome).toHaveBeenCalledTimes(1);
  });

  it('주고받은 말이 있으면 종료 시트로 물어본다', async () => {
    const endSession = vi.fn();
    const { result } = renderFlow(20_000, endSession);
    submitSmallTalkMessage.mockResolvedValueOnce(submitResponse());
    speakFor(result, 3);
    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('Hello there.');
    });

    let confirm: boolean | undefined;
    act(() => {
      confirm = result.current.pressClose();
    });

    expect(confirm).toBe(true);
    expect(endSession).not.toHaveBeenCalled();
  });

  it('작별 인사로 이미 끝났으면 인사가 끝나기 전이어도 묻지 않고 오늘의 스몰톡으로 간다', async () => {
    // 끝난 대화에 "직접 끝내볼래요"를 권할 이유가 없다
    submitSmallTalkMessage.mockResolvedValueOnce(
      submitResponse({ turnStatus: 'COMPLETED' }),
    );
    const endSession = vi.fn();
    const { result } = renderFlow(20_000, endSession);
    speakFor(result, 3);
    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('Bye!');
    });

    let confirm: boolean | undefined;
    act(() => {
      confirm = result.current.pressClose();
    });

    expect(confirm).toBe(false);
    expect(showSummary).toHaveBeenCalled();
    expect(endSession).not.toHaveBeenCalled();
  });

  it('첫 발화 응답을 기다리다 나갔으면 늦게 온 응답으로 대화를 이어가지 않는다', async () => {
    // 나간 뒤 종료 확인·완료 계측이 따라 나가면 이탈과 완료가 둘 다 남는다
    let resolveFirst!: (res: SmallTalkMessageSubmitResponse) => void;
    submitSmallTalkMessage.mockReturnValueOnce(
      new Promise((resolve) => (resolveFirst = resolve)),
    );
    const { result } = renderFlow(20_000);
    speakFor(result, 3);
    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('Bye!');
    });

    act(() => void result.current.pressClose());
    await act(async () =>
      resolveFirst(
        submitResponse({
          turnStatus: 'EXIT_CONFIRMATION_REQUIRED',
          nextMessage: null,
        }),
      ),
    );

    expect(decideSmallTalkExit).not.toHaveBeenCalled();
    expect(refreshStreak).not.toHaveBeenCalled();
  });

  it('발화를 서버가 받았으면 종료 확인 답을 기다리는 중에도 종료 시트로 물어본다', async () => {
    // 서버가 받아 준 발화는 응답이 온 순간 센다 — 종료 확인까지 기다리면 그 사이 대화가 없는 것처럼 보인다
    submitSmallTalkMessage.mockResolvedValueOnce(
      submitResponse({
        turnStatus: 'EXIT_CONFIRMATION_REQUIRED',
        nextMessage: null,
      }),
    );
    decideSmallTalkExit.mockReturnValueOnce(new Promise(() => {}));
    const endSession = vi.fn();
    const { result } = renderFlow(20_000, endSession);
    speakFor(result, 3);
    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('Bye!');
    });
    expect(decideSmallTalkExit).toHaveBeenCalled();

    let confirm: boolean | undefined;
    act(() => {
      confirm = result.current.pressClose();
    });

    expect(confirm).toBe(true);
    expect(endSession).not.toHaveBeenCalled();
  });

  it('나눈 대화 없이 말하는 중에 나가면 녹음을 먼저 취소한다', () => {
    // 인식 결과가 나간 뒤에 도착하면 홈 위에 "인식되지 않았어요" 토스트가 뜬다
    const { result } = renderFlow(20_000);
    act(() => result.current.input.pressMic());

    act(() => void result.current.pressClose());

    expect(sttMock.abort).toHaveBeenCalled();
  });

  it('이미 나간 대화면 X도 종료 버튼도 아무것도 하지 않는다', async () => {
    // 종료 확인 실패로 나간 뒤 — 이미 중도 종료한 세션에 완료를 보내면 409와 토스트가 한 번 더 난다
    const endSession = vi.fn();
    const { result } = renderFlow(20_000, endSession);
    submitSmallTalkMessage.mockResolvedValueOnce(
      submitResponse({
        turnStatus: 'EXIT_CONFIRMATION_REQUIRED',
        nextMessage: null,
      }),
    );
    decideSmallTalkExit.mockRejectedValueOnce(new Error('500'));
    speakFor(result, 3);
    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('Bye!');
    });
    expect(endSession).toHaveBeenCalledTimes(1);
    goHome.mockClear();

    let confirm: boolean | undefined;
    act(() => {
      confirm = result.current.pressClose();
    });
    await act(async () => result.current.completeTalk());

    expect(confirm).toBe(false);
    expect(completeSmallTalkSession).not.toHaveBeenCalled();
    expect(goHome).not.toHaveBeenCalled();
  });

  it('종료 확인을 기다리는 동안 끝내도 그 발화의 말한 시간까지 함께 남긴다', async () => {
    // 나눈 횟수와 말한 시간은 같은 시점의 값이어야 한다
    completeSmallTalkSession.mockResolvedValueOnce(undefined);
    submitSmallTalkMessage.mockResolvedValueOnce(
      submitResponse({
        turnStatus: 'EXIT_CONFIRMATION_REQUIRED',
        nextMessage: null,
        progress: { ...progress(12_000), accumulatedSpeakingDurationMs: 7_000 },
      }),
    );
    decideSmallTalkExit.mockReturnValueOnce(new Promise(() => {}));
    const { result } = renderFlow(20_000);
    speakFor(result, 3);
    await act(async () => {
      result.current.input.finishListening();
      sttMock.callbacks.onFinal?.('Bye!');
    });

    expect(result.current.summary.speakingDurationMs).toBe(7_000);
  });
});
