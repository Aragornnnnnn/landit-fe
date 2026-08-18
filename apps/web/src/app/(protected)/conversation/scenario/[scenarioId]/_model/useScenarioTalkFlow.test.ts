// useScenarioTalkFlow — 오프닝은 openingPreview로 즉시 시드, 세션은 백그라운드.
// 발화 제출 뒤 대기·속마음·다음질문·종료 전이와 입력·재생 훅 배선을 검증한다.
// (재생 폴백·입력 전환 세부는 useAiSpeech·useConversationInput 테스트가 맡는다)
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
import type { Scenario } from '@/features/scenario/lib/to-scenario';
import type { TtsVoice } from '@/shared/tts/voice';

import * as scenarioTalkApi from '../_api/scenario-session';
import type { ScenarioTalkSubmitResponse } from '../_api/scenario-session';
import { useScenarioTalkFlow } from './useScenarioTalkFlow';

const monitoringMock = vi.hoisted(() => ({
  reportError: vi.fn(),
  reportWarning: vi.fn(),
}));
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
    stop: vi.fn(),
  };
});
vi.mock('@/shared/tts/useTts', () => ({
  useTts: () => ({
    speak: ttsMock.speak,
    speakSrc: ttsMock.speakSrc,
    prefetch: ttsMock.prefetch,
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
    onFinal?: (t: string) => void;
  }) => {
    sttMock.callbacks.onInterim = opts.onInterim;
    sttMock.callbacks.onFinal = opts.onFinal;
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

// AI 선발화 시나리오 — 오프닝은 openingPreview에서 즉시 시드된다
const scenario = {
  scenarioId: 10,
  firstSpeaker: 'AI',
  openingPreview: {
    aiOpeningMessage: 'Hello, welcome in.',
    aiOpeningMessageTranslation: '어서 오세요.',
    userOpeningInstruction: null,
    innerThought: null,
    innerThoughtType: null,
    ttsVoice: voice,
    characterId: 'marco',
  },
} as unknown as Scenario;

const userScenario = {
  scenarioId: 11,
  firstSpeaker: 'USER',
  openingPreview: {
    aiOpeningMessage: null,
    aiOpeningMessageTranslation: null,
    userOpeningInstruction: '먼저 인사를 건네보세요.',
    innerThought: null,
    innerThoughtType: null,
    ttsVoice: voice,
  },
} as unknown as Scenario;

const withCharacter = (
  base: Scenario,
  characterId: Partner | null,
  ttsVoice: TtsVoice | null = voice,
): Scenario =>
  ({
    ...base,
    openingPreview: { ...base.openingPreview, characterId, ttsVoice },
  }) as unknown as Scenario;

// 세션 시작 응답 — 이제 주로 sessionId·progress 확보용 (오프닝은 openingPreview에서 시드)
const startResponse = () => ({
  sessionId: 1,
  scenarioId: 10,
  characterId: 'marco' as const,
  sessionType: 'SCENARIO',
  firstSpeaker: 'AI' as const,
  userOpeningInstruction: null,
  ttsVoice: null,
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
  },
  progress: {
    currentTurnNumber: 2,
    currentMessageSequenceNumber: 1,
    totalQuestionCount: 3,
    completed: false,
  },
  ...over,
});

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
  vi.useFakeTimers();
  ttsMock.state.onEnd = undefined;
  sttMock.callbacks.onInterim = undefined;
  sttMock.callbacks.onFinal = undefined;
  sttMock.start.mockClear();
  sttMock.stop.mockClear();
  sttMock.abort.mockClear();
  queryClientMock.prefetchQuery.mockClear();
  queryClientMock.invalidateQueries.mockClear();
  vi.unstubAllEnvs();
  startScenarioTalkSession.mockResolvedValue(startResponse());
  getInnerThought.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useScenarioTalkFlow', () => {
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

  it('제출이 실패하면 마이크 대기로 되돌아간다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockRejectedValue(new Error('network'));

    await speakAndSubmit(result, 'Hello!');

    expect(result.current.phase).toBe('USER_READY');
  });

  it('제출 실패를 Sentry로 보고한다 — 대화 턴이 유실되는 사고라 바로 알아야 한다', async () => {
    const { result } = await renderUserFirst();
    const error = new Error('network');
    submitScenarioTalkMessage.mockRejectedValue(error);

    await speakAndSubmit(result, 'Hello!');

    expect(monitoringMock.reportError).toHaveBeenCalledWith(error);
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
    act(() => ttsMock.state.onEnd?.());
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

    // 피드백은 완료 시점에 미리 만든다 (화면 진입 시 즉시 뜨도록)
    expect(queryClientMock.prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['session-feedback', 1] }),
    );
    // 다음 대화 해금이 홈에 반영되도록 시나리오 캐시를 무효화한다
    expect(queryClientMock.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['scenarios'],
    });
  });

  it('대화가 안 끝났으면 피드백을 미리 만들지 않는다', async () => {
    const { result } = await renderUserFirst();
    submitScenarioTalkMessage.mockResolvedValue(submitResponse()); // completed: false

    await speakAndSubmit(result, 'Hello!');

    expect(queryClientMock.prefetchQuery).not.toHaveBeenCalled();
  });

  it('오프닝은 미리 만든 정적 mp3로 재생하고, 끝나면 마이크 대기로 넘어간다', async () => {
    const { result } = renderHook(() => useScenarioTalkFlow(scenario));
    await act(async () => {});

    expect(ttsMock.speakSrc).toHaveBeenCalledWith(
      '/audio/opening-10.mp3',
      expect.anything(),
    );
    expect(ttsMock.speak).not.toHaveBeenCalled();

    act(() => ttsMock.state.onEnd?.());

    expect(result.current.phase).toBe('USER_READY');
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
      characterId: 'teddy',
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

    expect(submitScenarioTalkMessage).toHaveBeenCalledWith(
      1,
      'Hello there.',
      'VOICE',
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
});
