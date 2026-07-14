// useConversationFlow — 오프닝은 openingPreview로 즉시 시드, 세션은 백그라운드.
// 발화 제출 뒤 대기·속마음·다음질문·종료 전이와 오프닝 정적/폴백 재생을 검증한다.
import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Scenario } from '@/features/scenario/api/list';
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

// 마이크 대기 → 답변 입력 → 제출까지 한 번에 몰아준다
const speakAndSubmit = async (
  result: { current: ReturnType<typeof useConversationFlow> },
  text: string,
) => {
  act(() => result.current.pressMic());
  act(() => result.current.setTranscript(text));
  await act(async () => {
    await result.current.finishListening();
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
    act(() => result.current.setTranscript('Hello!'));
    act(() => {
      void result.current.finishListening();
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

  it('빈 답변은 제출하지 않는다', async () => {
    const { result } = await renderUserFirst();

    await speakAndSubmit(result, '   ');

    expect(submitMessage).not.toHaveBeenCalled();
    expect(result.current.phase).toBe('USER_LISTENING');
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

  it('속마음 생성이 실패(FAILED)해도 폴링을 멈추고 다음으로 진행한다', async () => {
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

    expect(result.current.phase).toBe('THOUGHT');
  });
});
