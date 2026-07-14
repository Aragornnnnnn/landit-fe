// useConversationFlow — 세션 시작 분기(AI/USER 선발화)와 발화 제출 뒤 속마음·다음질문·종료 전이 검증
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Scenario } from '@/features/scenario/api/list';

import * as sessionApi from '../api/session';
import type {
  SessionMessageSubmitResponse,
  SessionStartResponse,
} from '../api/session';
import { thoughtHoldMs } from './pacing';
import { useConversationFlow } from './useConversationFlow';

vi.mock('../api/session', () => ({
  startSession: vi.fn(),
  submitMessage: vi.fn(),
  endSession: vi.fn(),
}));

// TTS는 경계(재생)라 목으로 둔다 — speak의 onEnd를 붙잡아 재생 종료를 흉내 낸다
const ttsMock = vi.hoisted(() => {
  const state = { onEnd: undefined as (() => void) | undefined };
  return {
    state,
    speak: vi.fn(
      (_text: string, _voice: unknown, opts?: { onEnd?: () => void }) => {
        state.onEnd = opts?.onEnd;
        return Promise.resolve();
      },
    ),
    stop: vi.fn(),
  };
});
vi.mock('@/shared/lib/tts/useTts', () => ({
  useTts: () => ({ speak: ttsMock.speak, stop: ttsMock.stop, status: 'idle' }),
}));

const startSession = vi.mocked(sessionApi.startSession);
const submitMessage = vi.mocked(sessionApi.submitMessage);

const voice = {
  provider: 'OPENROUTER',
  model: 'mai-voice',
  providerVoiceId: 'en-US-Harper',
  gender: 'MALE' as const,
};

const scenario = { scenarioId: 10 } as unknown as Scenario;

const startResponse = (
  over: Partial<SessionStartResponse> = {},
): SessionStartResponse => ({
  sessionId: 1,
  scenarioId: 10,
  sessionType: 'SCENARIO',
  firstSpeaker: 'AI',
  userOpeningInstruction: null,
  ttsVoice: null,
  currentMessage: {
    messageId: 1,
    turnNumber: 1,
    messageSequence: 1,
    role: 'AI',
    content: 'Hello, welcome in.',
    translatedContent: '어서 오세요.',
    innerThought: '',
    innerThoughtType: 'NORMAL',
  },
  progress: {
    currentTurnNumber: 1,
    currentMessageSequenceNumber: 1,
    totalQuestionCount: 3,
    completed: false,
  },
  ...over,
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

// USER 선발화로 시작해 초기 AI 발화 타이머 없이 제출 흐름만 검증한다
const renderUserFirst = async () => {
  startSession.mockResolvedValue(
    startResponse({
      firstSpeaker: 'USER',
      currentMessage: null,
      userOpeningInstruction: '먼저 인사를 건네보세요.',
    }),
  );
  const hook = renderHook(() => useConversationFlow(scenario));
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

beforeEach(() => {
  vi.useFakeTimers();
  ttsMock.state.onEnd = undefined;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useConversationFlow', () => {
  it('AI가 먼저 말하면 currentMessage로 AI 발화부터 시작한다', async () => {
    startSession.mockResolvedValue(startResponse());

    const { result } = renderHook(() => useConversationFlow(scenario));
    await act(async () => {});

    expect(result.current.status).toBe('ready');
    expect(result.current.phase).toBe('AI_SPEAKING');
    expect(result.current.turn.aiMessage).toBe('Hello, welcome in.');
  });

  it('유저가 먼저 말하면 마이크 대기로 시작하고 오프닝 안내를 보여준다', async () => {
    const { result } = await renderUserFirst();

    expect(result.current.phase).toBe('USER_IDLE');
    expect(result.current.turn.aiMessage).toBe('먼저 인사를 건네보세요.');
  });

  it('세션 시작이 실패하면 status가 error가 된다', async () => {
    startSession.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useConversationFlow(scenario));
    await act(async () => {});

    expect(result.current.status).toBe('error');
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

  it('ttsVoice가 있으면 AI 발화를 TTS로 재생하고, 재생이 끝나면 마이크 대기로 넘어간다', async () => {
    startSession.mockResolvedValue(startResponse({ ttsVoice: voice }));

    const { result } = renderHook(() => useConversationFlow(scenario));
    await act(async () => {});

    expect(result.current.phase).toBe('AI_SPEAKING');
    expect(ttsMock.speak).toHaveBeenCalledWith(
      'Hello, welcome in.',
      voice,
      expect.anything(),
    );

    act(() => ttsMock.state.onEnd?.());

    expect(result.current.phase).toBe('USER_IDLE');
  });

  it('ttsVoice가 없으면 재생 없이 타이머로 발화를 마친다', async () => {
    startSession.mockResolvedValue(startResponse({ ttsVoice: null }));

    const { result } = renderHook(() => useConversationFlow(scenario));
    await act(async () => {});

    expect(ttsMock.speak).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(2600);
    });

    expect(result.current.phase).toBe('USER_IDLE');
  });

  it('ttsVoice 성별이 FEMALE이면 partner가 female이다', async () => {
    startSession.mockResolvedValue(
      startResponse({ ttsVoice: { ...voice, gender: 'FEMALE' } }),
    );

    const { result } = renderHook(() => useConversationFlow(scenario));
    await act(async () => {});

    expect(result.current.partner).toBe('female');
  });
});
