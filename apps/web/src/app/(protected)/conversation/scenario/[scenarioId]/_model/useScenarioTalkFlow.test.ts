// useScenarioTalkFlow — 오프닝은 openingPreview로 즉시 시드, 세션은 백그라운드.
// 발화 제출 뒤 대기·속마음·다음질문·종료 전이와 입력·재생 훅 배선을 검증한다.
// (재생 폴백·입력 전환 세부는 useAiSpeech·useConversationInput 테스트가 맡는다)
// @vitest-environment jsdom
import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as sessionApi from '@/features/conversation/api/session';
import type { Partner } from '@/features/conversation/model/character-look';
import {
  innerThoughtMaxPolls,
  innerThoughtPollMs,
  thoughtHoldMs,
} from '@/features/conversation/model/pacing';
import { rewardCompletion } from '@/features/reward/model/reward.fixture';
import { shouldAskSatisfaction } from '@/features/satisfaction/model/prompt-record';
import type { Scenario } from '@/features/scenario/lib/to-scenario';
import { track } from '@/shared/analytics';
import { ApiError } from '@/shared/api/api-error';
import type { AuthMember } from '@/shared/auth/api/social-login';
import { useAuthStore } from '@/shared/auth/auth-store';
import type { SttResultMeta } from '@/shared/stt/deepgram-stt';
import type { TtsVoice } from '@/shared/tts/voice';

import * as scenarioTalkApi from '../_api/scenario-session';
import type { ScenarioTalkSubmitResponse } from '../_api/scenario-session';
import { useScenarioTalkFlow } from './useScenarioTalkFlow';

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
// 광고 이벤트는 셸 경계 — 한 번만 보내는 규칙은 ad-event 테스트가 맡고, 여기서는 부르는지만 본다
const sendAdEventOnce = vi.hoisted(() => vi.fn());
vi.mock('@/shared/analytics', () => ({ track: vi.fn(), sendAdEventOnce }));
vi.mock('@/shared/monitoring/report', () => monitoringMock);

vi.mock('@/features/conversation/api/session', () => ({
  getInnerThought: vi.fn(),
  endSession: vi.fn(),
}));

vi.mock('../_api/scenario-session', () => ({
  startScenarioTalkSession: vi.fn(),
  submitScenarioTalkMessage: vi.fn(),
}));

// TTS는 경계(재생)라 목으로 둔다 — speak/speakSrc의 onEnd를 붙잡아 재생 종료를 흉내 낸다.
// 실패 폴백(onError)은 useAiSpeech 테스트가 맡는다.
const ttsMock = vi.hoisted(() => {
  const state = {
    onEnd: undefined as (() => void) | undefined,
  };
  return {
    state,
    speak: vi.fn(
      (_text: string, _voice: unknown, opts?: { onEnd?: () => void }) => {
        state.onEnd = opts?.onEnd;
        return Promise.resolve();
      },
    ),
    speakSrc: vi.fn((_src: string, opts?: { onEnd?: () => void }) => {
      state.onEnd = opts?.onEnd;
    }),
    prefetch: vi.fn(() => Promise.resolve()),
    prefetchSrc: vi.fn(),
    stop: vi.fn(),
  };
});
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

// STT도 경계(마이크)라 목으로 둔다 — start/stop 호출을 붙잡고, onInterim·onFinal로 인식 결과를 흉내 낸다.
// 오류·권한 처리(onError)는 useConversationInput 테스트가 맡는다.
const sttMock = vi.hoisted(() => {
  const callbacks = {
    onInterim: undefined as ((t: string) => void) | undefined,
    onFinal: undefined as ((t: string) => void) | undefined,
  };
  return {
    callbacks,
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
  };
});
vi.mock('@/shared/stt/useStt', () => ({
  useStt: (opts: {
    onInterim?: (t: string) => void;
    onFinal?: (t: string, meta: SttResultMeta) => void;
  }) => {
    sttMock.callbacks.onInterim = opts.onInterim;
    // 결과 정보는 계측용이라 흐름 검증과 무관하다 — 고정값을 붙여 넘긴다
    sttMock.callbacks.onFinal = (t: string) => opts.onFinal?.(t, STT_META);
    return {
      start: sttMock.start,
      stop: sttMock.stop,
      abort: sttMock.abort,
    };
  },
}));

// QueryClient는 경계 — 완료 시 피드백 prefetch·시나리오 무효화 호출만 확인한다
const queryClientMock = vi.hoisted(() => ({
  prefetchQuery: vi.fn(),
  invalidateQueries: vi.fn(),
  // 받아 둔 오늘의 시나리오 — 기본은 받아 둔 적 없음
  getQueryData: vi.fn(),
}));
// 환급 미리받기는 다른 기능의 후속이라 목으로 둔다 — 여기서는 완료 때 부르는지만 본다
const refreshRewardAfterCompletion = vi.hoisted(() => vi.fn());
vi.mock('@/features/reward/model/refresh-reward', () => ({
  refreshRewardAfterCompletion,
}));
// 스트릭 미리받기도 다른 기능의 후속이다 — 로그인한 사람으로 돌리는 테스트에서 캐시 목에 없는 호출을 하지 않게 막는다
vi.mock('@/features/streak/model/refresh-streak', () => ({
  refreshStreakAfterCompletion: vi.fn(),
}));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => queryClientMock,
}));

const startScenarioTalkSession = vi.mocked(
  scenarioTalkApi.startScenarioTalkSession,
);
const submitScenarioTalkMessage = vi.mocked(
  scenarioTalkApi.submitScenarioTalkMessage,
);
const getInnerThought = vi.mocked(sessionApi.getInnerThought);

const voice: TtsVoice = {
  provider: 'OPENROUTER',
  model: 'mai-voice',
  providerVoiceId: 'en-US-Ethan',
  gender: 'MALE',
};

// 서버가 준 첫 질문 음원 — 오프닝은 이 파일을 튼다
const OPENING_AUDIO_URL = 'https://cdn.example.com/questions/10.mp3';

// AI 선발화 시나리오 — 오프닝은 openingPreview에서 즉시 시드된다
const scenario = {
  scenarioId: 10,
  firstSpeaker: 'AI',
  openingPreview: {
    aiOpeningMessage: 'Hello, welcome in.',
    aiOpeningMessageTranslation: '어서 오세요.',
    questionAudioUrl: OPENING_AUDIO_URL,
    userOpeningInstruction: null,
    innerThought: null,
    innerThoughtType: null,
    character: { characterId: 'marco', ttsVoice: voice },
  },
} as unknown as Scenario;

const userScenario = {
  scenarioId: 11,
  firstSpeaker: 'USER',
  openingPreview: {
    aiOpeningMessage: null,
    aiOpeningMessageTranslation: null,
    questionAudioUrl: null,
    userOpeningInstruction: '먼저 인사를 건네보세요.',
    innerThought: null,
    innerThoughtType: null,
    character: { characterId: null, ttsVoice: voice },
  },
} as unknown as Scenario;

const withCharacter = (
  base: Scenario,
  characterId: Partner | null,
  ttsVoice: TtsVoice | null = voice,
): Scenario =>
  ({
    ...base,
    openingPreview: {
      ...base.openingPreview,
      character: { characterId, ttsVoice },
    },
  }) as unknown as Scenario;

// 세션 시작 응답 — 이제 주로 sessionId·progress 확보용 (오프닝은 openingPreview에서 시드)
const startResponse = () => ({
  sessionId: 1,
  scenarioId: 10,
  character: { characterId: 'marco' as const, ttsVoice: null },
  sessionType: 'SCENARIO',
  firstSpeaker: 'AI' as const,
  userOpeningInstruction: null,
  currentMessage: null,
  progress: {
    currentTurnNumber: 1,
    currentMessageSequenceNumber: 1,
    totalQuestionCount: 3,
    completed: false,
  },
});

const submitResponse = (
  over: Partial<ScenarioTalkSubmitResponse> = {},
): ScenarioTalkSubmitResponse => ({
  sessionId: 1,
  submittedMessage: {
    messageId: 2,
    turnNumber: 1,
    messageSequence: 2,
    role: 'USER',
    feedbackProcessingStatus: 'PREPARING',
    innerThoughtProcessingStatus: 'COMPLETED',
    innerThought: '또렷하게 잘 말했어.',
    innerThoughtType: 'GOOD',
  },
  nextMessage: {
    messageId: 3,
    turnNumber: 2,
    messageSequence: 1,
    role: 'AI',
    content: 'What size would you like?',
    translatedContent: '사이즈는 어떻게 드릴까요?',
    ttsText: null,
    fixedQuestionText: null,
    questionAudioUrl: null,
    answerGuide: null,
  },
  progress: {
    currentTurnNumber: 2,
    currentMessageSequenceNumber: 1,
    totalQuestionCount: 3,
    completed: false,
  },
  ...over,
});

// 분리 재생 소스(맞장구+질문 음원)가 실린 제출 응답
const splitSubmitResponse = () =>
  submitResponse({
    nextMessage: {
      messageId: 3,
      turnNumber: 2,
      messageSequence: 1,
      role: 'AI',
      content: 'Thanks! What size would you like?',
      translatedContent: '고마워요! 사이즈는 어떻게 드릴까요?',
      ttsText: 'Thanks!',
      fixedQuestionText: 'What size would you like?',
      questionAudioUrl: 'https://cdn.example.com/question-2.mp3',
      answerGuide: null,
    },
  });

// AI 선발화로 렌더하고 오프닝 발화까지 끝내 마이크 대기로 보낸다 (턴 진행·게이지 검증용)
const renderAiFirstReady = async () => {
  startScenarioTalkSession.mockResolvedValue(startResponse());
  const hook = renderHook(() => useScenarioTalkFlow(scenario));
  await act(async () => {});
  await act(async () => ttsMock.state.onEnd?.());
  return hook;
};

// USER 선발화로 렌더하고 백그라운드 세션을 flush한다 (제출에 sessionId 필요)
const renderUserFirst = async () => {
  startScenarioTalkSession.mockResolvedValue(startResponse());
  const hook = renderHook(() => useScenarioTalkFlow(userScenario));
  await act(async () => {});
  return hook;
};

// 마이크 대기 → 음성으로 말하기 → 완료(STT 최종) 제출까지 한 번에 몰아준다
const speakAndSubmit = async (
  result: { current: ReturnType<typeof useScenarioTalkFlow> },
  text: string,
) => {
  act(() => result.current.input.pressMic());
  await act(async () => {
    await result.current.input.finishListening(); // → stt.stop()
  });
  await act(async () => {
    sttMock.callbacks.onFinal?.(text); // 최종 텍스트 도착 → 음성 제출
  });
  // 말한 뒤 확인 단계에서 그대로 보낸다
  await act(async () => result.current.input.submitReviewed());
};

// 키보드로 입력 → 전송까지 몰아준다
const typeAndSubmit = async (
  result: { current: ReturnType<typeof useScenarioTalkFlow> },
  text: string,
) => {
  act(() => result.current.input.pressKeyboard());
  act(() => result.current.input.setTranscript(text));
  await act(async () => {
    await result.current.input.submitText();
  });
};

// 속마음이 아직 준비 중인(PREPARING) 제출 응답 — 다음 질문은 즉시, 속마음은 폴링으로 채운다
const preparingSubmitResponse = () =>
  submitResponse({
    submittedMessage: {
      messageId: 2,
      turnNumber: 1,
      messageSequence: 2,
      role: 'USER',
      feedbackProcessingStatus: 'PREPARING',
      innerThoughtProcessingStatus: 'PREPARING',
      innerThought: '',
      innerThoughtType: '',
    },
  });

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  ttsMock.state.onEnd = undefined;
  sttMock.callbacks.onInterim = undefined;
  sttMock.callbacks.onFinal = undefined;
  sttMock.start.mockClear();
  sttMock.stop.mockClear();
  sttMock.abort.mockClear();
  queryClientMock.prefetchQuery.mockClear();
  queryClientMock.invalidateQueries.mockClear();
  queryClientMock.getQueryData.mockReset();
  vi.unstubAllEnvs();
  startScenarioTalkSession.mockResolvedValue(startResponse());
  getInnerThought.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  useAuthStore.getState().clearAuth();
});

describe('useScenarioTalkFlow', async () => {
  it('AI 선발화면 openingPreview로 세션을 기다리지 않고 바로 AI 발화부터 시작한다', async () => {
    const { result } = renderHook(() => useScenarioTalkFlow(scenario));

    // 세션 flush 전에도 즉시 시드된다
    expect(result.current.phase).toBe('AI_SPEAKING');
    expect(result.current.turn.aiMessage).toBe('Hello, welcome in.');

    await act(async () => {});
  });

  it('유저가 먼저 말하면 마이크 대기로 시작하고 오프닝 안내를 보여준다', async () => {
    const { result } = await renderUserFirst();

    expect(result.current.phase).toBe('USER_READY');
    expect(result.current.turn.aiMessage).toBe('먼저 인사를 건네보세요.');
  });

  it('세션 시작이 실패해도 화면은 뜨고, 제출 시 마이크 대기로 되돌아간다', async () => {
    startScenarioTalkSession.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useScenarioTalkFlow(userScenario));
    await act(async () => {});

    expect(result.current.phase).toBe('USER_READY');

    await speakAndSubmit(result, 'Hello!');

    expect(submitScenarioTalkMessage).not.toHaveBeenCalled();
    expect(result.current.phase).toBe('USER_READY');
  });

  it('질문이 넘어가면 게이지가 찬다 — 답을 낸 순간이 아니라 다음 질문이 뜬 순간이다', async () => {
    // Given 총 3문항 시나리오의 첫 질문에서
    const { result } = await renderAiFirstReady();
    const atFirstQuestion = result.current.gauge.ratio;

    // When 답을 내면 — 속마음이 도는 동안은 아직 첫 질문 카드다
    submitScenarioTalkMessage.mockResolvedValue(submitResponse());
    await speakAndSubmit(result, 'First answer.');
    expect(result.current.gauge.ratio).toBe(atFirstQuestion);

    // Then 다음 질문이 뜨는 순간 함께 찬다
    act(() => {
      vi.advanceTimersByTime(thoughtHoldMs('또렷하게 잘 말했어.') + 50);
    });
    expect(result.current.gauge.ratio).toBeGreaterThan(atFirstQuestion);
  });

  it('마지막 질문 머리말은 그 질문이 화면에 뜬 뒤에 붙는다 — 답을 낸 직후 이전 질문 위에 먼저 뜨지 않는다', async () => {
    // Given 총 3문항 시나리오에서 두 번째 질문까지 받은 상태
    const { result } = await renderAiFirstReady();
    submitScenarioTalkMessage.mockResolvedValue(submitResponse());
    await speakAndSubmit(result, 'First answer.');
    act(() => {
      vi.advanceTimersByTime(thoughtHoldMs('또렷하게 잘 말했어.') + 50);
    });
    await act(async () => ttsMock.state.onEnd?.());

    // When 두 번째 답을 제출해 속마음이 도는 동안 (카드는 아직 두 번째 질문이다)
    await speakAndSubmit(result, 'Second answer.');

    // Then 머리말은 아직 붙지 않는다
    expect(result.current.gauge.lastQuestion).toBe(false);

    // 세 번째 질문이 화면에 뜨면 그때 붙는다
    act(() => {
      vi.advanceTimersByTime(thoughtHoldMs('또렷하게 잘 말했어.') + 50);
    });
    expect(result.current.gauge.lastQuestion).toBe(true);
  });

  it('제출하면 응답이 오기 전까지 대기(생각 중) 상태가 된다', async () => {
    const { result } = await renderUserFirst();
    let resolve: (value: ScenarioTalkSubmitResponse) => void = () => {};
    submitScenarioTalkMessage.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );

    act(() => result.current.input.pressMic());
    await act(async () => {
      await result.current.input.finishListening();
    });
    act(() => {
      sttMock.callbacks.onFinal?.('Hello!'); // 최종 텍스트 → 음성 제출 시작
    });
    // 말한 뒤 확인 단계에서 그대로 보낸다
    await act(async () => result.current.input.submitReviewed());

    expect(result.current.phase).toBe('AI_THINKING');

    await act(async () => resolve(submitResponse()));
  });

  it('발화를 제출하면 상대 속마음을 노출한다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockResolvedValue(submitResponse());

    await speakAndSubmit(result, 'Hello!');

    expect(result.current.phase).toBe('AI_INNER_THOUGHT');
    expect(result.current.turn.innerThought).toBe('또렷하게 잘 말했어.');
    expect(result.current.turn.innerThoughtType).toBe('GOOD');
  });

  it('응답이 끊기면 같은 답변을 같은 식별자로 자동으로 다시 보내 대화를 이어 간다', async () => {
    // Given 첫 제출이 응답 없이 끊기고, 다시 보내면 받는 상황
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage
      .mockRejectedValueOnce(new TypeError('Load failed'))
      .mockResolvedValueOnce(submitResponse());

    // When 답변을 보내고 재전송 간격만큼 기다리면
    await speakAndSubmit(result, 'Hello!');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    // Then 같은 답변이 한 번 더 나가고 속마음으로 이어진다. 실패로 보지 않는다
    const [first, resent] = submitScenarioTalkMessage.mock.calls;
    expect(resent).toEqual(first);
    expect(first[3]).toEqual(expect.any(String));
    expect(result.current.phase).toBe('AI_INNER_THOUGHT');
    expect(monitoringMock.reportError).not.toHaveBeenCalled();
  });

  it('다시 보내도 안 되면 방금 답변을 남긴 채 다시 보내기를 띄운다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockRejectedValue(new TypeError('Load failed'));

    await speakAndSubmit(result, 'Hello!');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(result.current.phase).toBe('USER_READY');
    expect(result.current.resend).toEqual(expect.any(Function));
    expect(result.current.input.transcript).toBe('Hello!');
  });

  it('다시 보내기를 띄울 때 한 번만 Sentry로 보고한다', async () => {
    const { result } = await renderUserFirst();
    const error = new TypeError('Load failed');
    submitScenarioTalkMessage.mockRejectedValue(error);

    await speakAndSubmit(result, 'Hello!');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(monitoringMock.reportError).toHaveBeenCalledTimes(1);
    expect(monitoringMock.reportError).toHaveBeenCalledWith(error);
  });

  it('서버 에러면 기다리지 않고 바로 다시 보내기를 띄운다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockRejectedValue(
      new ApiError('서버 오류', 500, '/api/v1/sessions/1/messages'),
    );

    await speakAndSubmit(result, 'Hello!');

    expect(submitScenarioTalkMessage).toHaveBeenCalledTimes(1);
    expect(result.current.resend).toEqual(expect.any(Function));
  });

  it('전달되지 못한 턴에서는 새로 말할 수 없다 — 서버가 다른 문장을 거절한다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockRejectedValue(
      new ApiError('서버 오류', 500, '/api/v1/sessions/1/messages'),
    );
    await speakAndSubmit(result, 'Hello!');
    sttMock.start.mockClear();

    act(() => result.current.input.pressMic());

    expect(sttMock.start).not.toHaveBeenCalled();
    expect(result.current.phase).toBe('USER_READY');
  });

  it('다시 보내기를 누르면 같은 답변을 같은 식별자로 보내 이어 간다', async () => {
    // Given 다시 보내기가 뜬 상태
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockRejectedValueOnce(
      new ApiError('서버 오류', 500, '/api/v1/sessions/1/messages'),
    );
    await speakAndSubmit(result, 'Hello!');

    // When 다시 보내기를 누르면
    submitScenarioTalkMessage.mockResolvedValueOnce(submitResponse());
    await act(async () => {
      result.current.resend?.();
    });

    // Then 처음과 똑같은 요청이 나가고 속마음으로 이어지며, 다시 보내기는 사라진다
    const [first, resent] = submitScenarioTalkMessage.mock.calls;
    expect(resent).toEqual(first);
    expect(result.current.phase).toBe('AI_INNER_THOUGHT');
    expect(result.current.resend).toBeUndefined();
  });

  it('말한 답을 확인하는 중에 대화를 나가면 확인 화면에서 나갔다고 남긴다', async () => {
    const { result } = await renderUserFirst();
    vi.mocked(sessionApi.endSession).mockResolvedValue(undefined);
    act(() => result.current.input.pressMic());
    await act(async () => {
      await result.current.input.finishListening();
    });
    await act(async () => {
      sttMock.callbacks.onFinal?.('Hello!');
    });

    act(() => result.current.leave());

    expect(track).toHaveBeenCalledWith(
      'Transcript Reviewed',
      expect.objectContaining({ action: 'leave' }),
    );
  });

  it('다시 보내는 사이 대화를 나가면 더 보내지 않고 실패도 알리지 않는다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockRejectedValue(new TypeError('Load failed'));
    vi.mocked(sessionApi.endSession).mockResolvedValue(undefined);
    await speakAndSubmit(result, 'Hello!');

    act(() => result.current.leave());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(submitScenarioTalkMessage).toHaveBeenCalledTimes(1);
    expect(monitoringMock.reportError).not.toHaveBeenCalled();
  });

  it('대화를 나간 뒤 응답이 도착하면 다음 질문을 준비하지 않고 속마음도 띄우지 않는다', async () => {
    // Given 답변을 보내고 응답을 기다리는 중
    const { result } = await renderUserFirst();
    let respond: (res: ScenarioTalkSubmitResponse) => void = () => {};
    submitScenarioTalkMessage.mockReturnValueOnce(
      new Promise((resolve) => {
        respond = resolve;
      }),
    );
    vi.mocked(sessionApi.endSession).mockResolvedValue(undefined);
    await speakAndSubmit(result, 'Hello!');

    // When 대화를 나간 뒤 응답이 도착하면
    act(() => result.current.leave());
    await act(async () => {
      respond(submitResponse());
    });

    // Then 다음 질문을 미리 합성하지 않고 속마음으로 넘어가지 않는다
    expect(ttsMock.prefetch).not.toHaveBeenCalled();
    expect(result.current.phase).not.toBe('AI_INNER_THOUGHT');
  });

  it('다음 턴의 발화는 새 식별자를 싣는다', async () => {
    // Given 첫 답을 보내고 두 번째 질문까지 받은 상태
    const { result } = await renderAiFirstReady();
    submitScenarioTalkMessage.mockResolvedValue(submitResponse());
    await speakAndSubmit(result, 'First answer.');
    act(() => {
      vi.advanceTimersByTime(thoughtHoldMs('또렷하게 잘 말했어.') + 50);
    });
    await act(async () => ttsMock.state.onEnd?.());

    // When 두 번째 답을 보내면
    await speakAndSubmit(result, 'Second answer.');

    // Then 첫 답과 다른 식별자가 실린다
    const [first, second] = submitScenarioTalkMessage.mock.calls;
    expect(second[3]).toEqual(expect.any(String));
    expect(second[3]).not.toBe(first[3]);
  });

  it('다음 질문이 있으면 속마음이 끝난 뒤 다음 AI 질문으로 이어간다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockResolvedValue(submitResponse());
    await speakAndSubmit(result, 'Hello!');

    act(() => {
      vi.advanceTimersByTime(thoughtHoldMs('또렷하게 잘 말했어.') + 50);
    });

    expect(result.current.phase).toBe('AI_SPEAKING');
    expect(result.current.turn.aiMessage).toBe('What size would you like?');
  });

  it('완료 턴에 종료 메시지가 오면 그걸 발화한 뒤 대화가 종료된다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockResolvedValue(
      submitResponse({
        nextMessage: {
          messageId: 9,
          turnNumber: 3,
          messageSequence: 1,
          role: 'AI',
          content: 'Thanks for chatting!',
          translatedContent: '대화 고마워요!',
          ttsText: null,
          fixedQuestionText: null,
          questionAudioUrl: null,
          answerGuide: null,
        },
        progress: {
          currentTurnNumber: 3,
          currentMessageSequenceNumber: 1,
          totalQuestionCount: 3,
          completed: true,
        },
      }),
    );
    await speakAndSubmit(result, 'Yes, here you go.');

    // 속마음이 끝나면 바로 종료하지 않고 종료 메시지를 발화(AI_SPEAKING)한다
    act(() => {
      vi.advanceTimersByTime(thoughtHoldMs('또렷하게 잘 말했어.') + 50);
    });
    expect(result.current.phase).toBe('AI_SPEAKING');
    expect(result.current.turn.aiMessage).toBe('Thanks for chatting!');

    // 그 발화가 끝나야 종료(→ CTA)로 간다
    await act(async () => ttsMock.state.onEnd?.());
    expect(result.current.phase).toBe('DONE');
  });

  it('대화가 완료되면 피드백을 미리 생성하고 시나리오 캐시를 무효화한다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockResolvedValue(
      submitResponse({
        nextMessage: {
          messageId: 4,
          turnNumber: 3,
          messageSequence: 1,
          role: 'AI',
          content: 'Great job today!',
          translatedContent: '오늘 잘했어요!',
          ttsText: null,
          fixedQuestionText: null,
          questionAudioUrl: null,
          answerGuide: null,
        },
        progress: {
          currentTurnNumber: 3,
          currentMessageSequenceNumber: 1,
          totalQuestionCount: 3,
          completed: true,
        },
        reward: rewardCompletion(),
      }),
    );

    await speakAndSubmit(result, 'Yes, here you go.');

    // 피드백은 완료 시점에 미리 만든다 (화면 진입 시 즉시 뜨도록)
    expect(queryClientMock.prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['session-feedback', 1] }),
    );
    // 다음 대화 해금이 홈에 반영되도록 시나리오 캐시를 무효화한다
    expect(queryClientMock.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['scenarios'],
    });
    // 홈에 돌아왔을 때 새 환급액이 서 있게 미리 받아 둔다
    expect(refreshRewardAfterCompletion).toHaveBeenCalledWith(queryClientMock, {
      // 오늘의 시나리오가 무엇인지 받아 둔 적이 없으면 오늘 것으로 치지 않는다
      todaysFirst: false,
      // 축하 화면의 받은 금액은 완료 응답의 영수증으로 정한다
      receipt: rewardCompletion(),
    });
    // 홈에 돌아가면 소감을 물을 차례라고 남긴다
    expect(shouldAskSatisfaction('scenario')).toBe(true);
  });

  it.each([
    ['서버가 끝내 본 적 없다고 하면 첫 시나리오 완료를 알린다', false, true],
    ['구독 응답을 받은 적 없으면 처음으로 쳐서 알린다', undefined, true],
    [
      '서버가 이미 끝내 본 적 있다고 하면 첫 시나리오 완료를 알리지 않는다',
      true,
      false,
    ],
  ])('대화가 완료됐을 때 %s', async (_, completedBefore, notified) => {
    useAuthStore
      .getState()
      .setAuth('access', 'refresh', { userId: 7 } as AuthMember);
    queryClientMock.getQueryData.mockImplementation((key: unknown) =>
      Array.isArray(key) &&
      key[0] === 'subscription' &&
      completedBefore !== undefined
        ? { conversationCompletedSinceLaunch: completedBefore }
        : undefined,
    );
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockResolvedValue(
      submitResponse({
        progress: {
          currentTurnNumber: 3,
          currentMessageSequenceNumber: 1,
          totalQuestionCount: 3,
          completed: true,
        },
      }),
    );

    await speakAndSubmit(result, 'Yes, here you go.');

    if (notified)
      expect(sendAdEventOnce).toHaveBeenCalledWith(
        'first_scenario_talk_completed',
        7,
      );
    else expect(sendAdEventOnce).not.toHaveBeenCalled();
  });

  it('제출 중에 구독이 새로 받아져 방금 끝낸 것이 이력에 들어가도 첫 시나리오 완료를 알린다', async () => {
    useAuthStore
      .getState()
      .setAuth('access', 'refresh', { userId: 7 } as AuthMember);
    let completedBefore = false;
    queryClientMock.getQueryData.mockImplementation((key: unknown) =>
      Array.isArray(key) && key[0] === 'subscription'
        ? { conversationCompletedSinceLaunch: completedBefore }
        : undefined,
    );
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockImplementation(async () => {
      completedBefore = true;
      return submitResponse({
        progress: {
          currentTurnNumber: 3,
          currentMessageSequenceNumber: 1,
          totalQuestionCount: 3,
          completed: true,
        },
      });
    });

    await speakAndSubmit(result, 'Yes, here you go.');

    expect(sendAdEventOnce).toHaveBeenCalledWith(
      'first_scenario_talk_completed',
      7,
    );
  });

  it('대화가 안 끝났으면 피드백을 미리 만들지 않는다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockResolvedValue(submitResponse()); // completed: false

    await speakAndSubmit(result, 'Hello!');

    expect(queryClientMock.prefetchQuery).not.toHaveBeenCalled();
    expect(shouldAskSatisfaction('scenario')).toBe(false);
  });

  it('오프닝은 openingPreview의 서버 음원(questionAudioUrl)으로 재생하고, 끝나면 마이크 대기로 넘어간다', async () => {
    const { result } = renderHook(() => useScenarioTalkFlow(scenario));
    await act(async () => {});

    expect(ttsMock.speakSrc).toHaveBeenCalledWith(
      OPENING_AUDIO_URL,
      expect.anything(),
    );
    expect(ttsMock.speak).not.toHaveBeenCalled();

    await act(async () => ttsMock.state.onEnd?.());

    expect(result.current.phase).toBe('USER_READY');
  });

  it('다시 듣기는 내 차례에만 열린다 — 상대 발화 중엔 잠겨 있고 내가 말하기 시작하면 다시 잠긴다', async () => {
    const { result } = renderHook(() => useScenarioTalkFlow(scenario));
    await act(async () => {});
    expect(result.current.replay?.enabled).toBe(false);

    await act(async () => ttsMock.state.onEnd?.()); // 오프닝 재생 종료 → 내 차례
    expect(result.current.replay?.enabled).toBe(true);

    act(() => result.current.input.pressMic());
    expect(result.current.replay?.enabled).toBe(false);
  });

  it('다시 듣기 시작만 계측하고, 재생이 끝나도 턴은 그대로다', async () => {
    const { result } = renderHook(() => useScenarioTalkFlow(scenario));
    await act(async () => {});
    await act(async () => ttsMock.state.onEnd?.());
    const replayedCount = () =>
      vi.mocked(track).mock.calls.filter(([name]) => name === 'Speech Replayed')
        .length;

    act(() => result.current.replay?.toggle()); // 시작
    act(() => result.current.replay?.toggle()); // 멈춤 — 안 찍는다
    expect(track).toHaveBeenCalledWith('Speech Replayed', {
      session_id: 1,
      turn_index: 0,
    });
    expect(replayedCount()).toBe(1);

    act(() => result.current.replay?.toggle()); // 다시 시작
    await act(async () => ttsMock.state.onEnd?.()); // 끝까지 재생
    expect(replayedCount()).toBe(2);
    expect(result.current.phase).toBe('USER_READY');
    expect(result.current.replay?.playing).toBe(false);
  });

  it('대화가 끝난 뒤에도 작별 인사는 다시 들을 수 있다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockResolvedValue(
      submitResponse({
        nextMessage: {
          messageId: 9,
          turnNumber: 3,
          messageSequence: 1,
          role: 'AI',
          content: 'Thanks for chatting!',
          translatedContent: '대화 고마워요!',
          ttsText: null,
          fixedQuestionText: null,
          questionAudioUrl: null,
          answerGuide: null,
        },
        progress: {
          currentTurnNumber: 3,
          currentMessageSequenceNumber: 1,
          totalQuestionCount: 3,
          completed: true,
        },
      }),
    );
    await speakAndSubmit(result, 'Yes, here you go.');
    act(() => {
      vi.advanceTimersByTime(thoughtHoldMs('또렷하게 잘 말했어.') + 50);
    });
    expect(result.current.replay?.enabled).toBe(false); // 종료 인사 발화 중

    await act(async () => ttsMock.state.onEnd?.());

    expect(result.current.phase).toBe('DONE');
    expect(result.current.replay?.enabled).toBe(true);
  });

  it('서버 음원이 없는 시나리오는 오프닝을 합성으로 말한다', async () => {
    // given — 음원이 아직 없는 시나리오 (구 데이터·신규 등록 직후)
    const withoutAudio = {
      ...scenario,
      openingPreview: { ...scenario.openingPreview, questionAudioUrl: null },
    } as unknown as Scenario;

    // when
    renderHook(() => useScenarioTalkFlow(withoutAudio));
    await act(async () => {});

    // then — 정적 재생 없이 첫 발화 원문을 상대 목소리로 합성한다
    expect(ttsMock.speakSrc).not.toHaveBeenCalled();
    expect(ttsMock.speak).toHaveBeenCalledWith(
      'Hello, welcome in.',
      voice,
      expect.anything(),
    );
  });

  it('상대는 시나리오의 characterId가 정한다', async () => {
    // given — 세션 응답을 기다리지 않고 openingPreview 값으로 바로 정해진다
    const { result } = renderHook(() =>
      useScenarioTalkFlow(withCharacter(scenario, 'chloe')),
    );
    await act(async () => {});

    // then
    expect(result.current.partner).toBe('chloe');
  });

  it('마르코가 테디와 같은 TTS 모델을 써도 마르코다', async () => {
    // given — 음성 모델로 상대를 추측하던 때의 회귀 (마르코=aura-2 hyperion, 테디=aura-2 draco)
    const auraVoice: TtsVoice = {
      ...voice,
      model: 'deepgram/aura-2',
      providerVoiceId: 'aura-2-hyperion-en',
    };
    const { result } = renderHook(() =>
      useScenarioTalkFlow(withCharacter(scenario, 'marco', auraVoice)),
    );
    await act(async () => {});

    // then
    expect(result.current.partner).toBe('marco');
  });

  it('테디 시나리오면 테디다', async () => {
    // given / when
    const { result } = renderHook(() =>
      useScenarioTalkFlow(withCharacter(scenario, 'teddy')),
    );
    await act(async () => {});

    // then
    expect(result.current.partner).toBe('teddy');
  });

  it('세션 시작 응답의 characterId는 얼굴을 바꾸지 않는다 — 시나리오 값으로 즉시 정하고 끝이다', async () => {
    // given — 세션은 백그라운드로 뒤늦게 오고, 값이 어긋나도 얼굴이 도중에 바뀌면 안 된다
    startScenarioTalkSession.mockResolvedValue({
      ...startResponse(),
      character: { characterId: 'teddy', ttsVoice: null },
    });
    const { result } = renderHook(() =>
      useScenarioTalkFlow(withCharacter(scenario, 'marco')),
    );
    await act(async () => {});

    // then
    expect(result.current.sessionId).toBe(1);
    expect(result.current.partner).toBe('marco');
  });

  it('characterId가 없으면 마르코다', async () => {
    // given — 음성 미배정 시나리오도 대화는 계속된다
    const { result } = renderHook(() =>
      useScenarioTalkFlow(withCharacter(scenario, null, null)),
    );
    await act(async () => {});

    // then
    expect(result.current.partner).toBe('marco');
  });

  it('제출 응답의 다음 질문을 미리 합성(prefetch)한다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockResolvedValue(submitResponse());

    await speakAndSubmit(result, 'Hello!');

    expect(ttsMock.prefetch).toHaveBeenCalledWith(
      'What size would you like?',
      voice,
    );
  });

  it('분리 재생 소스가 오면 맞장구만 미리 합성하고 질문 음원을 미리 연다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockResolvedValue(splitSubmitResponse());

    await speakAndSubmit(result, 'Hello!');

    expect(ttsMock.prefetch).toHaveBeenCalledWith('Thanks!', voice);
    expect(ttsMock.prefetchSrc).toHaveBeenCalledWith(
      'https://cdn.example.com/question-2.mp3',
    );
  });

  it('분리 재생 소스가 실린 다음 발화는 맞장구만 합성해 말한다', async () => {
    // 질문 음원 이어 재생은 useAiSpeech 테스트가 맡는다 — 여기서는 소스가 재생 훅까지 닿는 것만 본다
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockResolvedValue(splitSubmitResponse());
    await speakAndSubmit(result, 'Hello!');

    act(() => {
      vi.advanceTimersByTime(thoughtHoldMs('또렷하게 잘 말했어.') + 50);
    });

    expect(result.current.phase).toBe('AI_SPEAKING');
    expect(ttsMock.speak).toHaveBeenCalledWith(
      'Thanks!',
      voice,
      expect.anything(),
    );
  });

  it('속마음이 아직 준비 중이면 다음 질문은 바로 합성하고, 속마음은 폴링으로 완료를 기다렸다 노출한다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockResolvedValue(preparingSubmitResponse());
    getInnerThought
      .mockResolvedValueOnce({
        processingStatus: 'PREPARING',
        innerThought: null,
        innerThoughtType: null,
      })
      .mockResolvedValueOnce({
        processingStatus: 'COMPLETED',
        innerThought: '자연스럽게 잘 말했어.',
        innerThoughtType: 'GOOD',
      });

    await speakAndSubmit(result, 'Hello!');

    // 속마음은 준비 중이라 대기 유지 — 하지만 다음 질문 합성은 이미 시작됐다
    expect(result.current.phase).toBe('AI_THINKING');
    expect(ttsMock.prefetch).toHaveBeenCalledWith(
      'What size would you like?',
      voice,
    );

    // 0.5s 폴링 1회 — 아직 PREPARING
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(result.current.phase).toBe('AI_THINKING');

    // 0.5s 폴링 2회 — COMPLETED → 속마음 노출
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(result.current.phase).toBe('AI_INNER_THOUGHT');
    expect(result.current.turn.innerThought).toBe('자연스럽게 잘 말했어.');
    expect(result.current.turn.innerThoughtType).toBe('GOOD');
  });

  it('StrictMode 재마운트 뒤에도 속마음 폴링이 죽지 않고 완료를 노출한다', async () => {
    startScenarioTalkSession.mockResolvedValue(startResponse());
    const { result } = renderHook(() => useScenarioTalkFlow(userScenario), {
      wrapper: StrictMode,
    });
    await act(async () => {});
    submitScenarioTalkMessage.mockResolvedValue(preparingSubmitResponse());
    getInnerThought.mockResolvedValue({
      processingStatus: 'COMPLETED',
      innerThought: '좋아, 자연스러웠어.',
      innerThoughtType: 'GOOD',
    });

    await speakAndSubmit(result, 'Hello!');
    expect(result.current.phase).toBe('AI_THINKING');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.phase).toBe('AI_INNER_THOUGHT');
    expect(result.current.turn.innerThought).toBe('좋아, 자연스러웠어.');
  });

  it('속마음 생성이 실패(FAILED)하면 빈 말풍선 대신 건너뛰고 다음 질문으로 넘어간다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockResolvedValue(preparingSubmitResponse());
    getInnerThought.mockResolvedValue({
      processingStatus: 'FAILED',
      innerThought: null,
      innerThoughtType: null,
    });

    await speakAndSubmit(result, 'Hello!');
    expect(result.current.phase).toBe('AI_THINKING');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // 속마음 노출(AI_INNER_THOUGHT) 없이 바로 다음 AI 발화로
    expect(result.current.phase).toBe('AI_SPEAKING');
    expect(result.current.turn.aiMessage).toBe('What size would you like?');
    expect(result.current.turn.innerThought).toBe('');
  });

  it('속마음 생성 실패(FAILED)를 Sentry에 warning으로 보고한다 — 대화는 건너뛰고 계속된다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockResolvedValue(preparingSubmitResponse());
    getInnerThought.mockResolvedValue({
      processingStatus: 'FAILED',
      innerThought: null,
      innerThoughtType: null,
    });

    await speakAndSubmit(result, 'Hello!');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(monitoringMock.reportWarning).toHaveBeenCalledWith(
      expect.stringContaining('failed'),
      expect.objectContaining({ sessionId: 1 }),
    );
  });

  it('폴링이 API 오류로 끝나면 그 오류를 보고한다 — 문자열만 남기면 원인을 잃는다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockResolvedValue(preparingSubmitResponse());
    const apiError = new Error('서버 오류가 발생했어요. (500)');
    getInnerThought.mockRejectedValue(apiError);

    await speakAndSubmit(result, 'Hello!');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(
        innerThoughtPollMs * innerThoughtMaxPolls,
      );
    });

    expect(monitoringMock.reportWarning).toHaveBeenCalledWith(
      apiError,
      expect.objectContaining({ sessionId: 1 }),
    );
  });

  // 입력 훅 배선 — 듣기 전이와 최종 발화 제출이 상태기계·세션 API로 이어지는지
  it('세션이 시작되면 sessionId를 노출한다 (피드백 생성에 쓴다)', async () => {
    const { result } = await renderUserFirst();

    expect(result.current.sessionId).toBe(1);
  });

  it('말하기를 누르면 듣기로 넘어가며 마이크(STT)를 켠다', async () => {
    const { result } = await renderUserFirst();

    act(() => result.current.input.pressMic());

    expect(result.current.phase).toBe('USER_SPEAKING');
    expect(result.current.input.keyboardMode).toBe(false);
    expect(sttMock.start).toHaveBeenCalled();
  });

  it('음성으로 완료하면 STT 최종 텍스트를 VOICE로 제출한다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockResolvedValue(submitResponse());

    act(() => result.current.input.pressMic());
    // 발화 중 실시간 미리보기
    act(() => sttMock.callbacks.onInterim?.('Hel'));
    expect(result.current.input.transcript).toBe('Hel');

    // 완료(■) → stt.stop() 호출, 최종 텍스트는 onFinal로 도착해 제출을 잇는다
    await act(async () => {
      await result.current.input.finishListening();
    });
    expect(sttMock.stop).toHaveBeenCalled();
    expect(submitScenarioTalkMessage).not.toHaveBeenCalled();

    await act(async () => {
      sttMock.callbacks.onFinal?.('Hello there.');
    });
    // 말한 뒤 확인 단계에서 그대로 보낸다
    await act(async () => result.current.input.submitReviewed());

    expect(submitScenarioTalkMessage).toHaveBeenCalledWith(
      1,
      'Hello there.',
      'VOICE',
      expect.any(String),
      false,
    );
    // 제출이 이어져 속마음까지 진행된다 (submitResponse 기본은 COMPLETED)
    expect(result.current.phase).toBe('AI_INNER_THOUGHT');
  });

  it('키보드로 입력한 텍스트는 TEXT로 제출한다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockResolvedValue(submitResponse());

    await typeAndSubmit(result, 'Hello there.');

    expect(submitScenarioTalkMessage).toHaveBeenCalledWith(
      1,
      'Hello there.',
      'TEXT',
      expect.any(String),
      false,
    );
    expect(sttMock.start).not.toHaveBeenCalled();
  });

  it('중단(X)하면 세션을 파기하고 마이크 대기로 되돌린다', async () => {
    const { result } = await renderUserFirst();

    act(() => result.current.input.pressMic());
    act(() => sttMock.callbacks.onInterim?.('Hel'));

    act(() => result.current.input.cancelInput());

    expect(sttMock.abort).toHaveBeenCalled();
    expect(result.current.phase).toBe('USER_READY');
    expect(result.current.input.transcript).toBe('');
    expect(result.current.input.keyboardMode).toBe(false);
  });

  describe('답변 가이드', () => {
    const openingGuide = {
      content: "I'm a student. I like watching movies.",
      translatedContent: '난 학생이야. 영화 보는 걸 좋아해.',
    };
    const nextGuide = {
      content: 'I watched a movie yesterday. It was fun.',
      translatedContent: '어제 영화를 봤어. 재미있었어.',
    };
    const guidedScenario = {
      ...scenario,
      openingPreview: { ...scenario.openingPreview, answerGuide: openingGuide },
    } as unknown as Scenario;

    it('첫 질문의 가이드는 시나리오 미리보기에서 바로 보여 준다', async () => {
      const { result } = renderHook(() => useScenarioTalkFlow(guidedScenario));

      expect(result.current.answerGuide).toEqual(openingGuide);

      await act(async () => {});
    });

    it('미리보기에 첫 발화가 없으면 세션 시작 응답의 첫 질문 가이드를 쓴다', async () => {
      // given — 미리보기 없이 들어와 세션 응답이 첫 질문을 채운다
      startScenarioTalkSession.mockResolvedValue({
        ...startResponse(),
        currentMessage: {
          messageId: 1,
          turnNumber: 1,
          messageSequence: 1,
          role: 'AI',
          content: 'Hey! Can you introduce yourself?',
          translatedContent: '자기소개 해 줄래?',
          innerThought: '',
          innerThoughtType: '',
          questionAudioUrl: null,
          answerGuide: openingGuide,
        },
      });
      const noPreview = {
        ...scenario,
        openingPreview: null,
      } as unknown as Scenario;

      const { result } = renderHook(() => useScenarioTalkFlow(noPreview));
      await act(async () => {});

      expect(result.current.answerGuide).toEqual(openingGuide);
    });

    it('다음 질문의 가이드는 그 질문이 화면에 뜬 뒤에 바뀐다 — 속마음이 도는 동안엔 보이지 않는다', async () => {
      // given — 첫 질문에서 답을 내고, 다음 질문에 가이드가 실려 온다
      startScenarioTalkSession.mockResolvedValue(startResponse());
      const { result } = renderHook(() => useScenarioTalkFlow(guidedScenario));
      await act(async () => {});
      await act(async () => ttsMock.state.onEnd?.());
      submitScenarioTalkMessage.mockResolvedValue(
        submitResponse({
          nextMessage: {
            ...submitResponse().nextMessage!,
            answerGuide: nextGuide,
          },
        }),
      );

      // when — 답을 내 속마음이 도는 동안
      await speakAndSubmit(result, 'I am a student.');

      // then — 이전 질문 카드에는 다음 질문 가이드가 붙지 않는다
      expect(result.current.answerGuide).toBeNull();

      act(() => {
        vi.advanceTimersByTime(thoughtHoldMs('또렷하게 잘 말했어.') + 50);
      });
      expect(result.current.answerGuide).toEqual(nextGuide);
    });

    it('다음 질문에 가이드가 없으면 보여 주지 않는다', async () => {
      startScenarioTalkSession.mockResolvedValue(startResponse());
      const { result } = renderHook(() => useScenarioTalkFlow(guidedScenario));
      await act(async () => {});
      await act(async () => ttsMock.state.onEnd?.());
      submitScenarioTalkMessage.mockResolvedValue(
        submitResponse({
          nextMessage: {
            ...submitResponse().nextMessage!,
            answerGuide: null,
          },
        }),
      );

      await speakAndSubmit(result, 'I am a student.');
      act(() => {
        vi.advanceTimersByTime(thoughtHoldMs('또렷하게 잘 말했어.') + 50);
      });

      expect(result.current.answerGuide).toBeNull();
    });

    // 첫 질문을 다 듣고 내 차례가 된 상태
    const renderGuidedReady = async () => {
      startScenarioTalkSession.mockResolvedValue(startResponse());
      const hook = renderHook(() => useScenarioTalkFlow(guidedScenario));
      await act(async () => {});
      await act(async () => ttsMock.state.onEnd?.());
      return hook;
    };

    it('가이드를 열어 본 답변은 열람했다고 함께 보낸다', async () => {
      // Given 첫 질문에서 가이드를 열어 본 상태
      const { result } = await renderGuidedReady();
      submitScenarioTalkMessage.mockResolvedValue(submitResponse());
      act(() => result.current.markGuideViewed());

      // When 답을 내면
      await speakAndSubmit(result, 'I am a student.');

      // Then 열람했다고 함께 보낸다
      expect(submitScenarioTalkMessage.mock.calls[0][4]).toBe(true);
    });

    it('가이드를 열지 않은 답변은 열람하지 않았다고 보낸다', async () => {
      const { result } = await renderGuidedReady();
      submitScenarioTalkMessage.mockResolvedValue(submitResponse());

      await speakAndSubmit(result, 'I am a student.');

      expect(submitScenarioTalkMessage.mock.calls[0][4]).toBe(false);
    });

    it('다시 보내도 열람 여부는 처음 보낸 값 그대로다 — 바뀌면 서버가 거절한다', async () => {
      // Given 가이드를 열고 낸 답이 끊긴 상태
      const { result } = await renderGuidedReady();
      submitScenarioTalkMessage
        .mockRejectedValueOnce(new TypeError('Load failed'))
        .mockResolvedValueOnce(submitResponse());
      act(() => result.current.markGuideViewed());
      await speakAndSubmit(result, 'I am a student.');

      // When 재전송 간격만큼 기다려 다시 보내면
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      // Then 처음과 똑같이 열람했다고 보낸다
      const [first, resent] = submitScenarioTalkMessage.mock.calls;
      expect(first[4]).toBe(true);
      expect(resent).toEqual(first);
    });

    it('다음 질문에서는 열람 여부를 새로 센다', async () => {
      // Given 첫 질문에서 가이드를 열고 답한 뒤 다음 질문이 뜬 상태
      const { result } = await renderGuidedReady();
      submitScenarioTalkMessage.mockResolvedValue(submitResponse());
      act(() => result.current.markGuideViewed());
      await speakAndSubmit(result, 'I am a student.');
      act(() => {
        vi.advanceTimersByTime(thoughtHoldMs('또렷하게 잘 말했어.') + 50);
      });
      await act(async () => ttsMock.state.onEnd?.());

      // When 가이드를 열지 않고 답하면
      await speakAndSubmit(result, 'I like movies.');

      // Then 이번 답변은 열람하지 않았다고 보낸다
      expect(submitScenarioTalkMessage.mock.calls[1][4]).toBe(false);
    });
  });
});
