// 유저 입력 훅 검증 — 마이크/키보드 전환, STT 배선, 최종 발화 전달과 권한 안내
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MicPermissionDeniedError } from '@/shared/stt/errors';

import { useConversationInput } from './useConversationInput';

// STT는 경계(마이크)라 목으로 둔다 — start/stop 호출을 붙잡고, onInterim·onFinal 콜백을 흉내 낸다
const sttMock = vi.hoisted(() => {
  const callbacks = {
    onInterim: undefined as ((t: string) => void) | undefined,
    onFinal: undefined as ((t: string) => void) | undefined,
    onError: undefined as ((e: Error) => void) | undefined,
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
    onError?: (e: Error) => void;
  }) => {
    sttMock.callbacks.onInterim = opts.onInterim;
    sttMock.callbacks.onFinal = opts.onFinal;
    sttMock.callbacks.onError = opts.onError;
    return {
      start: sttMock.start,
      stop: sttMock.stop,
      abort: sttMock.abort,
    };
  },
}));

const renderInput = (
  over: Partial<Parameters<typeof useConversationInput>[0]> = {},
) => {
  const onInputStart = vi.fn();
  const onInputCancel = vi.fn();
  const onContent = vi.fn();
  const hook = renderHook(() =>
    useConversationInput({
      canStart: true,
      trackContext: () => ({ sessionId: 1, turnIndex: 0 }),
      onInputStart,
      onInputCancel,
      onContent,
      ...over,
    }),
  );
  return { ...hook, onInputStart, onInputCancel, onContent };
};

beforeEach(() => {
  sttMock.callbacks.onInterim = undefined;
  sttMock.callbacks.onFinal = undefined;
  sttMock.callbacks.onError = undefined;
  sttMock.start.mockClear();
  sttMock.stop.mockClear();
  sttMock.abort.mockClear();
});

describe('useConversationInput', () => {
  it('말하기를 누르면 듣기 시작을 알리고 마이크(STT)를 켠다', () => {
    const { result, onInputStart } = renderInput();

    act(() => result.current.pressMic());

    expect(onInputStart).toHaveBeenCalledTimes(1);
    expect(sttMock.start).toHaveBeenCalled();
    expect(result.current.keyboardMode).toBe(false);
  });

  it('대기 상태가 아니면 말하기를 눌러도 무시한다', () => {
    // 빠른 연타·상태 전이 중 중복 탭이 녹음 시작을 이중 집계하지 않게
    const { result, onInputStart } = renderInput({ canStart: false });

    act(() => result.current.pressMic());

    expect(onInputStart).not.toHaveBeenCalled();
    expect(sttMock.start).not.toHaveBeenCalled();
  });

  it('말하는 동안 실시간 인식 결과를 transcript로 보여준다', () => {
    const { result } = renderInput();

    act(() => result.current.pressMic());
    act(() => sttMock.callbacks.onInterim?.('Hel'));

    expect(result.current.transcript).toBe('Hel');
  });

  it('음성 완료(■)는 STT를 멈추고, 최종 텍스트가 오면 VOICE로 전달한다', () => {
    const { result, onContent } = renderInput();

    act(() => result.current.pressMic());
    act(() => result.current.finishListening());
    expect(sttMock.stop).toHaveBeenCalled();
    expect(onContent).not.toHaveBeenCalled();

    act(() => sttMock.callbacks.onFinal?.('Hello there.'));

    expect(onContent).toHaveBeenCalledWith('Hello there.', 'VOICE');
  });

  it('최종 텍스트가 공백뿐이면 전달하지 않고 듣기 취소로 되돌린다', () => {
    // 조용히 무시하면 마이크는 꺼졌는데 UI만 듣는 중으로 갇힌다
    const { result, onContent, onInputCancel } = renderInput();

    act(() => result.current.pressMic());
    act(() => sttMock.callbacks.onFinal?.('   '));

    expect(onContent).not.toHaveBeenCalled();
    expect(onInputCancel).toHaveBeenCalledTimes(1);
    expect(result.current.transcript).toBe('');
  });

  it('대기 상태가 아니면 키보드를 눌러도 무시한다', () => {
    // 마이크와 같은 가드 — phase는 안 바뀌는데 keyboardMode만 켜지는 불일치를 막는다
    const { result, onInputStart } = renderInput({ canStart: false });

    act(() => result.current.pressKeyboard());

    expect(onInputStart).not.toHaveBeenCalled();
    expect(result.current.keyboardMode).toBe(false);
  });

  it('키보드 아이콘을 누르면 마이크 없이 타이핑 모드로 듣기를 시작한다', () => {
    const { result, onInputStart } = renderInput();

    act(() => result.current.pressKeyboard());

    expect(onInputStart).toHaveBeenCalledTimes(1);
    expect(sttMock.start).not.toHaveBeenCalled();
    expect(result.current.keyboardMode).toBe(true);
  });

  it('타이핑한 텍스트는 앞뒤 공백을 다듬어 TEXT로 전달한다', () => {
    const { result, onContent } = renderInput();

    act(() => result.current.pressKeyboard());
    act(() => result.current.setTranscript('  Hello there. '));
    act(() => result.current.submitText());

    expect(onContent).toHaveBeenCalledWith('Hello there.', 'TEXT');
  });

  it('빈 타이핑은 전달하지 않는다', () => {
    const { result, onContent, onInputCancel } = renderInput();

    act(() => result.current.pressKeyboard());
    act(() => result.current.submitText());

    expect(onContent).not.toHaveBeenCalled();
    expect(onInputCancel).not.toHaveBeenCalled(); // 조용히 무시 — 입력창은 그대로 열려 있다
  });

  it('음성 중단(X)은 세션을 완료가 아니라 파기한다', () => {
    const { result, onInputCancel } = renderInput();

    act(() => result.current.pressMic());
    act(() => sttMock.callbacks.onInterim?.('Hel'));
    act(() => result.current.cancelInput());

    expect(sttMock.abort).toHaveBeenCalled();
    expect(sttMock.stop).not.toHaveBeenCalled(); // stop(확정)이면 결과가 제출로 이어진다
    expect(onInputCancel).toHaveBeenCalledTimes(1);
    expect(result.current.transcript).toBe('');
    expect(result.current.keyboardMode).toBe(false);
  });

  it('타이핑 취소는 STT를 건드리지 않고 마이크 모드로 복귀한다', () => {
    const { result, onInputCancel } = renderInput();

    act(() => result.current.pressKeyboard());
    act(() => result.current.cancelInput());

    expect(sttMock.stop).not.toHaveBeenCalled();
    expect(sttMock.abort).not.toHaveBeenCalled();
    expect(onInputCancel).toHaveBeenCalledTimes(1);
    expect(result.current.keyboardMode).toBe(false);
  });

  it('STT 일반 오류는 듣기 취소로 되돌리고 권한 안내는 띄우지 않는다', () => {
    const { result, onInputCancel } = renderInput();

    act(() => result.current.pressMic());
    act(() =>
      sttMock.callbacks.onError?.(new Error('음성 인식 오류: network')),
    );

    expect(onInputCancel).toHaveBeenCalledTimes(1);
    expect(result.current.transcript).toBe('');
    expect(result.current.micPermissionDenied).toBe(false);
  });

  it('마이크 권한 거부면 듣기 취소와 함께 권한 안내를 띄우고, 닫으면 내려간다', () => {
    const { result, onInputCancel } = renderInput();

    act(() => result.current.pressMic());
    act(() => sttMock.callbacks.onError?.(new MicPermissionDeniedError()));

    expect(onInputCancel).toHaveBeenCalledTimes(1);
    expect(result.current.micPermissionDenied).toBe(true);

    act(() => result.current.dismissMicPermissionNotice());
    expect(result.current.micPermissionDenied).toBe(false);
  });

  it('다음 턴 준비(resetForNextTurn)는 transcript를 비우고 마이크 모드로 되돌린다', () => {
    const { result } = renderInput();

    act(() => result.current.pressKeyboard());
    act(() => result.current.setTranscript('typed'));
    act(() => result.current.resetForNextTurn());

    expect(result.current.transcript).toBe('');
    expect(result.current.keyboardMode).toBe(false);
  });
});
