// useConversationFlow — 오프닝은 openingPreview로 즉시 시드, 세션은 백그라운드.
// 발화 제출 뒤 대기·속마음·다음질문·종료 전이와 오프닝 정적/폴백 재생을 검증한다.
import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Scenario } from '@/features/scenario/api/list';
import { MicPermissionDeniedError } from '@/shared/lib/stt/errors';
import type { TtsVoice } from '@/shared/lib/tts/tts.types';

import * as sessionApi from '../api/session';
import type { SessionMessageSubmitResponse } from '../api/session';
import { thoughtHoldMs } from './pacing';
import { useConversationFlow } from './useConversationFlow';

vi.mock('../api/session', () => ({
  startSession: vi.fn(),
  submitMessage: vi.fn(),
  getInnerThought: vi.fn(),
  endSession: vi.fn(),
}));

// TTS는 경계(재생)라 목으로 둔다 — speak/speakSrc의 onEnd·onError를 붙잡아 종료·실패를 흉내 낸다
const ttsMock = vi.hoisted(() => {
  const state = {
    onEnd: undefined as (() => void) | undefined,
    onError: undefined as (() => void) | undefined,
  };
  return {
    state,
    speak: vi.fn(
      (_text: string, _voice: unknown, opts?: { onEnd?: () => void }) => {
        state.onEnd = opts?.onEnd;
        return Promise.resolve();
      },
    ),
    speakSrc: vi.fn(
      (_src: string, opts?: { onEnd?: () => void; onError?: () => void }) => {
        state.onEnd = opts?.onEnd;
        state.onError = opts?.onError;
      },
    ),
    prefetch: vi.fn(() => Promise.resolve()),
    stop: vi.fn(),
  };
});
vi.mock('@/shared/lib/tts/useTts', () => ({
  useTts: () => ({
    speak: ttsMock.speak,
    speakSrc: ttsMock.speakSrc,
    prefetch: ttsMock.prefetch,
    stop: ttsMock.stop,
    status: 'idle',
  }),
}));

// STT도 경계(마이크)라 목으로 둔다 — start/stop 호출을 붙잡고, onInterim·onFinal 콜백을 흉내 낸다
const sttMock = vi.hoisted(() => {
  const callbacks = {
    onInterim: undefined as ((t: string) => void) | undefined,
    onFinal: undefined as ((t: string) => void) | undefined,
    onError: undefined as ((e: Error) => void) | undefined,
  };
  return {
    callbacks,
    status: 'idle' as 'idle' | 'connecting' | 'listening' | 'error',
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
  };
});
vi.mock('@/shared/lib/stt/useStt', () => ({
  useStt: (opts: {
    onInterim?: (t: string) => void;
    onFinal?: (t: string) => void;
    onError?: (e: Error) => void;
  }) => {
    sttMock.callbacks.onInterim = opts.onInterim;
    sttMock.callbacks.onFinal = opts.onFinal;
    sttMock.callbacks.onError = opts.onError;
    return {
      transcript: '',
      interim: '',
      status: sttMock.status,
      error: null,
      isListening: sttMock.status === 'listening',
      start: sttMock.start,
      stop: sttMock.stop,
      reset: sttMock.reset,
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

const startSession = vi.mocked(sessionApi.startSession);
const submitMessage = vi.mocked(sessionApi.submitMessage);
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

const withVoice = (base: Scenario, ttsVoice: TtsVoice | null): Scenario =>
  ({
    ...base,
    openingPreview: { ...base.openingPreview, ttsVoice },
  }) as unknown as Scenario;

// 세션 시작 응답 — 이제 주로 sessionId·progress 확보용 (오프닝은 openingPreview에서 시드)
const startResponse = () => ({
  sessionId: 1,
  scenarioId: 10,
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
  over: Partial<SessionMessageSubmitResponse> = {},
): SessionMessageSubmitResponse => ({
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
  startSession.mockResolvedValue(startResponse());
  const hook = renderHook(() => useConversationFlow(userScenario));
  await act(async () => {});
  return hook;
};

// 마이크 대기 → 음성으로 말하기 → 완료(STT 최종) 제출까지 한 번에 몰아준다
const speakAndSubmit = async (
  result: { current: ReturnType<typeof useConversationFlow> },
  text: string,
) => {
  act(() => result.current.pressMic());
  await act(async () => {
    await result.current.finishListening(); // → stt.stop()
  });
  await act(async () => {
    sttMock.callbacks.onFinal?.(text); // 최종 텍스트 도착 → 음성 제출
  });
};

// 키보드로 입력 → 전송까지 몰아준다
const typeAndSubmit = async (
  result: { current: ReturnType<typeof useConversationFlow> },
  text: string,
) => {
  act(() => result.current.pressKeyboard());
  act(() => result.current.setTranscript(text));
  await act(async () => {
    await result.current.submitText();
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
  ttsMock.state.onError = undefined;
  sttMock.status = 'idle';
  sttMock.callbacks.onInterim = undefined;
  sttMock.callbacks.onFinal = undefined;
  sttMock.callbacks.onError = undefined;
  sttMock.start.mockClear();
  sttMock.stop.mockClear();
  sttMock.reset.mockClear();
  queryClientMock.prefetchQuery.mockClear();
  queryClientMock.invalidateQueries.mockClear();
  vi.unstubAllEnvs();
  startSession.mockResolvedValue(startResponse());
  getInnerThought.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useConversationFlow', () => {
  it('AI 선발화면 openingPreview로 세션을 기다리지 않고 바로 AI 발화부터 시작한다', async () => {
    const { result } = renderHook(() => useConversationFlow(scenario));

    // 세션 flush 전에도 즉시 시드된다
    expect(result.current.phase).toBe('AI_SPEAKING');
    expect(result.current.turn.aiMessage).toBe('Hello, welcome in.');

    await act(async () => {});
  });

  it('유저가 먼저 말하면 마이크 대기로 시작하고 오프닝 안내를 보여준다', async () => {
    const { result } = await renderUserFirst();

    expect(result.current.phase).toBe('USER_IDLE');
    expect(result.current.turn.aiMessage).toBe('먼저 인사를 건네보세요.');
  });

  it('세션 시작이 실패해도 화면은 뜨고, 제출 시 마이크 대기로 되돌아간다', async () => {
    startSession.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useConversationFlow(userScenario));
    await act(async () => {});

    expect(result.current.phase).toBe('USER_IDLE');

    await speakAndSubmit(result, 'Hello!');

    expect(submitMessage).not.toHaveBeenCalled();
    expect(result.current.phase).toBe('USER_IDLE');
  });

  it('제출하면 응답이 오기 전까지 대기(생각 중) 상태가 된다', async () => {
    const { result } = await renderUserFirst();
    let resolve: (value: SessionMessageSubmitResponse) => void = () => {};
    submitMessage.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );

    act(() => result.current.pressMic());
    await act(async () => {
      await result.current.finishListening();
    });
    act(() => {
      sttMock.callbacks.onFinal?.('Hello!'); // 최종 텍스트 → 음성 제출 시작
    });

    expect(result.current.phase).toBe('WAITING');

    await act(async () => resolve(submitResponse()));
  });

  it('발화를 제출하면 상대 속마음을 노출한다', async () => {
    const { result } = await renderUserFirst();
    submitMessage.mockResolvedValue(submitResponse());

    await speakAndSubmit(result, 'Hello!');

    expect(result.current.phase).toBe('THOUGHT');
    expect(result.current.turn.innerThought).toBe('또렷하게 잘 말했어.');
    expect(result.current.turn.innerThoughtType).toBe('GOOD');
  });

  it('제출이 실패하면 마이크 대기로 되돌아간다', async () => {
    const { result } = await renderUserFirst();
    submitMessage.mockRejectedValue(new Error('network'));

    await speakAndSubmit(result, 'Hello!');

    expect(result.current.phase).toBe('USER_IDLE');
  });

  it('빈 음성 답변은 제출하지 않고 마이크 대기로 되돌린다', async () => {
    // 듣는 중 상태에 남겨두면 마이크는 꺼졌는데 UI만 듣는 중으로 갇힌다
    const { result } = await renderUserFirst();

    await speakAndSubmit(result, '   ');

    expect(submitMessage).not.toHaveBeenCalled();
    expect(result.current.phase).toBe('USER_IDLE');
  });

  it('다음 질문이 있으면 속마음이 끝난 뒤 다음 AI 질문으로 이어간다', async () => {
    const { result } = await renderUserFirst();
    submitMessage.mockResolvedValue(submitResponse());
    await speakAndSubmit(result, 'Hello!');

    act(() => {
      vi.advanceTimersByTime(thoughtHoldMs('또렷하게 잘 말했어.') + 50);
    });

    expect(result.current.phase).toBe('AI_SPEAKING');
    expect(result.current.turn.aiMessage).toBe('What size would you like?');
  });

  it('다음 질문이 없으면(completed) 속마음이 끝난 뒤 대화가 종료된다', async () => {
    const { result } = await renderUserFirst();
    submitMessage.mockResolvedValue(
      submitResponse({
        nextMessage: null,
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

    expect(result.current.phase).toBe('DONE');
  });

  it('완료 턴에 종료 메시지가 오면 그걸 발화한 뒤 대화가 종료된다', async () => {
    const { result } = await renderUserFirst();
    submitMessage.mockResolvedValue(
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
    submitMessage.mockResolvedValue(
      submitResponse({
        nextMessage: null,
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
    submitMessage.mockResolvedValue(submitResponse()); // completed: false

    await speakAndSubmit(result, 'Hello!');

    expect(queryClientMock.prefetchQuery).not.toHaveBeenCalled();
  });

  it('오프닝은 미리 만든 정적 mp3로 재생하고, 끝나면 마이크 대기로 넘어간다', async () => {
    const { result } = renderHook(() => useConversationFlow(scenario));
    await act(async () => {});

    expect(ttsMock.speakSrc).toHaveBeenCalledWith(
      '/audio/opening-10.mp3',
      expect.anything(),
    );
    expect(ttsMock.speak).not.toHaveBeenCalled();

    act(() => ttsMock.state.onEnd?.());

    expect(result.current.phase).toBe('USER_IDLE');
  });

  it('오프닝 정적 파일이 없으면 합성으로 폴백한다', async () => {
    const { result } = renderHook(() => useConversationFlow(scenario));
    await act(async () => {});

    act(() => ttsMock.state.onError?.()); // 정적 파일 없음(404)

    expect(ttsMock.speak).toHaveBeenCalledWith(
      'Hello, welcome in.',
      voice,
      expect.anything(),
    );
    act(() => ttsMock.state.onEnd?.());
    expect(result.current.phase).toBe('USER_IDLE');
  });

  it('오프닝 파일도 음성도 없으면 타이머로 발화를 마친다', async () => {
    const { result } = renderHook(() =>
      useConversationFlow(withVoice(scenario, null)),
    );
    await act(async () => {});

    act(() => ttsMock.state.onError?.()); // 정적 파일 없음

    expect(ttsMock.speak).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(2600);
    });

    expect(result.current.phase).toBe('USER_IDLE');
  });

  it('ttsVoice 성별이 FEMALE이면 partner가 female이다', async () => {
    const { result } = renderHook(() =>
      useConversationFlow(withVoice(scenario, { ...voice, gender: 'FEMALE' })),
    );
    await act(async () => {});

    expect(result.current.partner).toBe('female');
  });

  it('제출 응답의 다음 질문을 미리 합성(prefetch)한다', async () => {
    const { result } = await renderUserFirst();
    submitMessage.mockResolvedValue(submitResponse());

    await speakAndSubmit(result, 'Hello!');

    expect(ttsMock.prefetch).toHaveBeenCalledWith(
      'What size would you like?',
      voice,
    );
  });

  it('속마음이 아직 준비 중이면 다음 질문은 바로 합성하고, 속마음은 폴링으로 완료를 기다렸다 노출한다', async () => {
    const { result } = await renderUserFirst();
    submitMessage.mockResolvedValue(preparingSubmitResponse());
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
    expect(result.current.phase).toBe('WAITING');
    expect(ttsMock.prefetch).toHaveBeenCalledWith(
      'What size would you like?',
      voice,
    );

    // 0.5s 폴링 1회 — 아직 PREPARING
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(result.current.phase).toBe('WAITING');

    // 0.5s 폴링 2회 — COMPLETED → 속마음 노출
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(result.current.phase).toBe('THOUGHT');
    expect(result.current.turn.innerThought).toBe('자연스럽게 잘 말했어.');
    expect(result.current.turn.innerThoughtType).toBe('GOOD');
  });

  it('StrictMode 재마운트 뒤에도 속마음 폴링이 죽지 않고 완료를 노출한다', async () => {
    startSession.mockResolvedValue(startResponse());
    const { result } = renderHook(() => useConversationFlow(userScenario), {
      wrapper: StrictMode,
    });
    await act(async () => {});
    submitMessage.mockResolvedValue(preparingSubmitResponse());
    getInnerThought.mockResolvedValue({
      processingStatus: 'COMPLETED',
      innerThought: '좋아, 자연스러웠어.',
      innerThoughtType: 'GOOD',
    });

    await speakAndSubmit(result, 'Hello!');
    expect(result.current.phase).toBe('WAITING');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.phase).toBe('THOUGHT');
    expect(result.current.turn.innerThought).toBe('좋아, 자연스러웠어.');
  });

  it('속마음 생성이 실패(FAILED)하면 빈 말풍선 대신 건너뛰고 다음 질문으로 넘어간다', async () => {
    const { result } = await renderUserFirst();
    submitMessage.mockResolvedValue(preparingSubmitResponse());
    getInnerThought.mockResolvedValue({
      processingStatus: 'FAILED',
      innerThought: null,
      innerThoughtType: null,
    });

    await speakAndSubmit(result, 'Hello!');
    expect(result.current.phase).toBe('WAITING');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // 속마음 노출(THOUGHT) 없이 바로 다음 AI 발화로
    expect(result.current.phase).toBe('AI_SPEAKING');
    expect(result.current.turn.aiMessage).toBe('What size would you like?');
    expect(result.current.turn.innerThought).toBe('');
  });

  // STT(LAN-141) 배선 — 기본은 마이크(음성), 키보드 아이콘을 누르면 타이핑
  it('세션이 시작되면 sessionId를 노출한다 (피드백 생성에 쓴다)', async () => {
    const { result } = await renderUserFirst();

    expect(result.current.sessionId).toBe(1);
  });

  it('말하기를 누르면 듣기로 넘어가며 마이크(STT)를 켠다', async () => {
    const { result } = await renderUserFirst();

    act(() => result.current.pressMic());

    expect(result.current.phase).toBe('USER_LISTENING');
    expect(result.current.keyboardMode).toBe(false);
    expect(sttMock.start).toHaveBeenCalled();
  });

  it('음성으로 완료하면 STT 최종 텍스트를 VOICE로 제출한다', async () => {
    const { result } = await renderUserFirst();
    submitMessage.mockResolvedValue(submitResponse());

    act(() => result.current.pressMic());
    // 발화 중 실시간 미리보기
    act(() => sttMock.callbacks.onInterim?.('Hel'));
    expect(result.current.transcript).toBe('Hel');

    // 완료(■) → stt.stop() 호출, 최종 텍스트는 onFinal로 도착해 제출을 잇는다
    await act(async () => {
      await result.current.finishListening();
    });
    expect(sttMock.stop).toHaveBeenCalled();
    expect(submitMessage).not.toHaveBeenCalled();

    await act(async () => {
      sttMock.callbacks.onFinal?.('Hello there.');
    });

    expect(submitMessage).toHaveBeenCalledWith(1, 'Hello there.', 'VOICE');
    // 제출이 이어져 속마음까지 진행된다 (submitResponse 기본은 COMPLETED)
    expect(result.current.phase).toBe('THOUGHT');
  });

  it('키보드 아이콘을 누르면 마이크를 켜지 않고 타이핑 모드가 된다', async () => {
    const { result } = await renderUserFirst();

    act(() => result.current.pressKeyboard());

    expect(result.current.phase).toBe('USER_LISTENING');
    expect(result.current.keyboardMode).toBe(true);
    expect(sttMock.start).not.toHaveBeenCalled();
  });

  it('키보드로 입력한 텍스트는 TEXT로 제출한다', async () => {
    const { result } = await renderUserFirst();
    submitMessage.mockResolvedValue(submitResponse());

    await typeAndSubmit(result, 'Hello there.');

    expect(submitMessage).toHaveBeenCalledWith(1, 'Hello there.', 'TEXT');
    expect(sttMock.start).not.toHaveBeenCalled();
  });

  it('중단(X)하면 STT를 멈추고 마이크 대기로 되돌린다', async () => {
    const { result } = await renderUserFirst();

    act(() => result.current.pressMic());
    act(() => sttMock.callbacks.onInterim?.('Hel'));

    act(() => result.current.cancelListening());

    expect(sttMock.stop).toHaveBeenCalled();
    expect(result.current.phase).toBe('USER_IDLE');
    expect(result.current.transcript).toBe('');
    expect(result.current.keyboardMode).toBe(false);
  });

  it('STT가 오류나면 마이크 대기로 되돌린다', async () => {
    const { result } = await renderUserFirst();

    act(() => result.current.pressMic());
    expect(result.current.phase).toBe('USER_LISTENING');

    // 일반 인식 오류로 STT가 onError를 알리면 마이크 대기로 되돌린다
    act(() =>
      sttMock.callbacks.onError?.(new Error('음성 인식 오류: network')),
    );

    expect(result.current.phase).toBe('USER_IDLE');
    expect(result.current.transcript).toBe('');
  });

  it('마이크 권한 거부면 대기로 되돌리고 권한 안내를 띄운다', async () => {
    const { result } = await renderUserFirst();

    act(() => result.current.pressMic());
    act(() => sttMock.callbacks.onError?.(new MicPermissionDeniedError()));

    expect(result.current.phase).toBe('USER_IDLE');
    expect(result.current.micPermissionDenied).toBe(true);
  });

  it('일반 인식 오류는 권한 안내를 띄우지 않는다', async () => {
    const { result } = await renderUserFirst();

    act(() => result.current.pressMic());
    act(() =>
      sttMock.callbacks.onError?.(new Error('음성 인식 오류: network')),
    );

    expect(result.current.micPermissionDenied).toBe(false);
  });

  it('권한 안내를 닫으면 상태가 내려간다', async () => {
    const { result } = await renderUserFirst();

    act(() => result.current.pressMic());
    act(() => sttMock.callbacks.onError?.(new MicPermissionDeniedError()));
    expect(result.current.micPermissionDenied).toBe(true);

    act(() => result.current.dismissMicPermissionNotice());
    expect(result.current.micPermissionDenied).toBe(false);
  });
});
