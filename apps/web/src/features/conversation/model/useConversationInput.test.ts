// 유저 입력 훅 검증 — 마이크/키보드 전환, STT 배선, 최종 발화 전달과 권한 안내
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SttResultMeta } from '@/shared/stt/deepgram-stt';
import { MicPermissionDeniedError, SttError } from '@/shared/stt/errors';
import type { SttErrorMeta } from '@/shared/stt/useStt';

import { useConversationInput } from './useConversationInput';

const monitoringMock = vi.hoisted(() => ({
  reportError: vi.fn(),
  reportWarning: vi.fn(),
}));
vi.mock('@/shared/monitoring/report', () => monitoringMock);

const trackMock = vi.hoisted(() => vi.fn());
vi.mock('@/shared/analytics', () => ({ track: trackMock }));

const FINAL_META: SttResultMeta = {
  engine: 'deepgram',
  endReason: 'finalize',
  connectMs: 300,
  finalizeWaitMs: 500,
};
const ERROR_META: SttErrorMeta = { engine: 'deepgram' };

// STT는 경계(마이크)라 목으로 둔다 — start/stop 호출을 붙잡고, onInterim(확정 텍스트·남은 말)·onFinal 콜백을 흉내 낸다
const sttMock = vi.hoisted(() => {
  const callbacks = {
    onInterim: undefined as ((t: string, pending: boolean) => void) | undefined,
    onFinal: undefined as
      ((t: string, meta: SttResultMeta) => void) | undefined,
    onError: undefined as ((e: Error, meta: SttErrorMeta) => void) | undefined,
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
    onInterim?: (t: string, pending: boolean) => void;
    onFinal?: (t: string, meta: SttResultMeta) => void;
    onError?: (e: Error, meta: SttErrorMeta) => void;
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
  trackMock.mockClear();
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

  it('말하는 동안 확정된 인식 결과를 transcript로 보여준다', () => {
    const { result } = renderInput();

    act(() => result.current.pressMic());
    act(() => sttMock.callbacks.onInterim?.('Hel', true));

    expect(result.current.transcript).toBe('Hel');
  });

  it('확정 전 말이 남아 있는지를 speechPending으로 알려 준다', () => {
    const { result } = renderInput();

    act(() => result.current.pressMic());
    act(() => sttMock.callbacks.onInterim?.('I went', true));
    expect(result.current.speechPending).toBe(true);

    act(() => sttMock.callbacks.onInterim?.('I went to the park', false));
    expect(result.current.speechPending).toBe(false);
  });

  it('음성 완료(■)는 STT를 멈추고, 최종 텍스트가 오면 보내지 않고 확인 단계로 보여 준다', () => {
    // 발음 때문에 잘못 알아들은 문장이 그대로 가지 않게, 보내기 전에 한 번 보여 준다
    const { result, onContent } = renderInput();

    act(() => result.current.pressMic());
    act(() => result.current.finishListening());
    expect(sttMock.stop).toHaveBeenCalled();

    act(() => sttMock.callbacks.onFinal?.('Hello there.', FINAL_META));

    expect(onContent).not.toHaveBeenCalled();
    expect(result.current.reviewing).toBe(true);
    expect(result.current.transcript).toBe('Hello there.');
  });

  it('확인 단계에서 보내면 VOICE로, 마이크를 켠 순간부터 인식이 끝날 때까지 걸린 시간과 함께 전달한다', () => {
    // 스몰톡의 일일 발화 예산이 이 값으로 깎인다 — 확인하며 머문 시간은 말한 시간이 아니다
    vi.useFakeTimers();
    const { result, onContent } = renderInput();

    act(() => result.current.pressMic());
    act(() => vi.advanceTimersByTime(3200));
    act(() => sttMock.callbacks.onFinal?.('Hello there.', FINAL_META));
    act(() => vi.advanceTimersByTime(5000));
    act(() => result.current.submitReviewed());

    expect(onContent).toHaveBeenCalledWith('Hello there.', 'VOICE', 3200);
    vi.useRealTimers();
  });

  it('최종 텍스트가 공백뿐이면 전달하지 않고 듣기 취소로 되돌린다', () => {
    // 조용히 무시하면 마이크는 꺼졌는데 UI만 듣는 중으로 갇힌다
    const { result, onContent, onInputCancel } = renderInput();

    act(() => result.current.pressMic());
    act(() => sttMock.callbacks.onFinal?.('   ', FINAL_META));

    expect(onContent).not.toHaveBeenCalled();
    expect(onInputCancel).toHaveBeenCalledTimes(1);
    expect(result.current.transcript).toBe('');
  });

  it('인식 결과가 오면 엔진·종료 사유·대기 시간을 계측한다', () => {
    const { result } = renderInput();

    act(() => result.current.pressMic());
    act(() => sttMock.callbacks.onFinal?.('Hello there.', FINAL_META));

    expect(trackMock).toHaveBeenCalledWith('Speech Recognition Completed', {
      session_id: 1,
      turn_index: 0,
      engine: 'deepgram',
      end_reason: 'finalize',
      connect_ms: 300,
      finalize_wait_ms: 500,
      char_count: 12,
    });
  });

  it('빈 결과도 글자 수 0으로 계측해 연결 실패와 구분한다', () => {
    const { result } = renderInput();

    act(() => result.current.pressMic());
    act(() => sttMock.callbacks.onFinal?.('   ', FINAL_META));

    expect(trackMock).toHaveBeenCalledWith(
      'Speech Recognition Completed',
      expect.objectContaining({ char_count: 0 }),
    );
  });

  it('인식 실패는 엔진과 함께 연결 실패·도중 끊김 같은 사유로 계측한다', () => {
    const { result } = renderInput();

    act(() => result.current.pressMic());
    act(() =>
      sttMock.callbacks.onError?.(
        new SttError('STT 연결 실패', 'connect_failed'),
        ERROR_META,
      ),
    );

    expect(trackMock).toHaveBeenCalledWith('Speech Recognition Failed', {
      engine: 'deepgram',
      reason: 'connect_failed',
    });
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

    // 타이핑은 말한 게 아니라 쓴 것 — 발화 시간은 0이다
    expect(onContent).toHaveBeenCalledWith('Hello there.', 'TEXT', 0);
  });

  it('타이핑하다 키보드를 다시 눌러도 쓰던 글은 남는다', () => {
    // 전송이 실패하면 화면은 마이크 대기로 돌아간다 — 거기서 다시 키보드를 눌렀을 때
    // 초안을 비우면 방금 쓴 답변을 전부 다시 쳐야 한다
    const { result } = renderInput();

    act(() => result.current.pressKeyboard());
    act(() => result.current.setTranscript('Hello there.'));
    act(() => result.current.pressKeyboard());

    expect(result.current.transcript).toBe('Hello there.');
  });

  it('말한 내용이 남아 있을 때 키보드를 누르면 그 글부터 고쳐 쓴다', () => {
    // 음성 제출이 실패해 돌아온 자리 — 인식된 문장을 지우면 처음부터 다시 말해야 한다
    const { result } = renderInput();

    act(() => result.current.pressMic());
    act(() => sttMock.callbacks.onInterim?.('Hello there.', false));
    act(() => result.current.pressKeyboard());

    expect(result.current.transcript).toBe('Hello there.');
  });

  it('말한 내용을 키보드로 고쳐 쓸 때 허용 밖 글자는 미리 거른다', () => {
    // 첫 영어 입력에 인식기가 적어 둔 기호가 지워지며 경고가 뜨면, 영어만 친 사람이 혼난 꼴이 된다
    const { result } = renderInput();

    act(() => result.current.pressMic());
    act(() => sttMock.callbacks.onInterim?.("I'm #1 at 30°", false));
    act(() => result.current.pressKeyboard());

    expect(result.current.transcript).toBe("I'm 1 at 30");
  });

  it('마이크로 시작하면 쓰던 초안을 지운다', () => {
    // 말하기는 인식 결과로 처음부터 채운다 — 쓰다 만 글이 남아 있으면 말하지도 않은 문장이
    // 인식된 것처럼 보인다
    const { result } = renderInput();

    act(() => result.current.pressKeyboard());
    act(() => result.current.setTranscript('Hello there.'));
    act(() => result.current.pressMic());

    expect(result.current.transcript).toBe('');
  });

  it('타이핑에 한글이 남아 있으면 빼고 전달한다', () => {
    // 입력창이 걸러도 조합이 덜 끝난 채 전송되는 틈이 있다 — 마지막 관문에서 한 번 더 거른다
    const { result, onContent } = renderInput();

    act(() => result.current.pressKeyboard());
    act(() => result.current.setTranscript('Hello 안'));
    act(() => result.current.submitText());

    expect(onContent).toHaveBeenCalledWith('Hello', 'TEXT', 0);
  });

  it('한글을 빼고 나면 빈 타이핑은 전달하지 않는다', () => {
    const { result, onContent } = renderInput();

    act(() => result.current.pressKeyboard());
    act(() => result.current.setTranscript('안녕하세요'));
    act(() => result.current.submitText());

    expect(onContent).not.toHaveBeenCalled();
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
    act(() => sttMock.callbacks.onInterim?.('Hel', true));
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
      sttMock.callbacks.onError?.(
        new Error('음성 인식 오류: network'),
        ERROR_META,
      ),
    );

    expect(onInputCancel).toHaveBeenCalledTimes(1);
    expect(result.current.transcript).toBe('');
    expect(result.current.micPermissionDenied).toBe(false);
  });

  it('인식 오류를 Sentry에 warning으로 보고한다 — 다시 말하면 되지만 빈도는 봐야 한다', () => {
    const { result } = renderInput();
    const error = new Error('음성 인식 오류: network');

    act(() => result.current.pressMic());
    act(() => sttMock.callbacks.onError?.(error, ERROR_META));

    expect(monitoringMock.reportWarning).toHaveBeenCalledWith(error);
  });

  it('마이크 권한 거부는 Sentry에 보고하지 않는다 — 유저의 선택이지 결함이 아니다', () => {
    const { result } = renderInput();

    act(() => result.current.pressMic());
    act(() =>
      sttMock.callbacks.onError?.(new MicPermissionDeniedError(), ERROR_META),
    );

    expect(monitoringMock.reportError).not.toHaveBeenCalled();
    expect(monitoringMock.reportWarning).not.toHaveBeenCalled();
  });

  it('마이크 권한 거부면 듣기 취소와 함께 권한 안내를 띄우고, 닫으면 내려간다', () => {
    const { result, onInputCancel } = renderInput();

    act(() => result.current.pressMic());
    act(() =>
      sttMock.callbacks.onError?.(new MicPermissionDeniedError(), ERROR_META),
    );

    expect(onInputCancel).toHaveBeenCalledTimes(1);
    expect(result.current.micPermissionDenied).toBe(true);

    act(() => result.current.dismissMicPermissionNotice());
    expect(result.current.micPermissionDenied).toBe(false);
  });

  describe('말한 뒤 확인', () => {
    // 말하기를 마쳐 인식된 문장이 확인 단계에 올라온 상태
    const renderReviewing = (text = 'I went to the bitch.') => {
      const rendered = renderInput();
      act(() => rendered.result.current.pressMic());
      act(() => rendered.result.current.finishListening());
      act(() => sttMock.callbacks.onFinal?.(text, FINAL_META));
      trackMock.mockClear();
      sttMock.start.mockClear();
      return rendered;
    };

    it('다시 말하기는 인식된 문장을 버리고 듣기 단계 그대로 마이크를 다시 켠다', () => {
      const { result, onInputStart, onInputCancel } = renderReviewing();

      act(() => result.current.speakAgain());

      expect(result.current.reviewing).toBe(false);
      expect(result.current.transcript).toBe('');
      expect(sttMock.start).toHaveBeenCalledTimes(1);
      // 대화 단계는 말하는 중 그대로다 — 시작·취소를 다시 알리지 않는다
      expect(onInputStart).toHaveBeenCalledTimes(1);
      expect(onInputCancel).not.toHaveBeenCalled();
    });

    it('다시 말하다 취소하면 처음부터가 아니라 직전에 인식된 문장으로 확인에 돌아간다', () => {
      // X는 방금 한 일(다시 말하기)만 되돌린다 — 이미 있던 답까지 버리면 처음부터 다시 말해야 한다
      const { result, onInputCancel } = renderReviewing();

      act(() => result.current.speakAgain());
      act(() => sttMock.callbacks.onInterim?.('I went', true));
      act(() => result.current.cancelInput());

      expect(sttMock.abort).toHaveBeenCalled();
      expect(onInputCancel).not.toHaveBeenCalled();
      expect(result.current.reviewing).toBe(true);
      expect(result.current.transcript).toBe('I went to the bitch.');
    });

    it('다시 말한 게 인식되지 않으면 직전에 인식된 문장으로 확인에 돌아간다', () => {
      const { result, onInputCancel } = renderReviewing();

      act(() => result.current.speakAgain());
      act(() => sttMock.callbacks.onFinal?.('   ', FINAL_META));

      expect(onInputCancel).not.toHaveBeenCalled();
      expect(result.current.reviewing).toBe(true);
      expect(result.current.transcript).toBe('I went to the bitch.');
    });

    it('다시 말하다 인식 오류가 나도 직전에 인식된 문장으로 확인에 돌아간다', () => {
      const { result, onInputCancel } = renderReviewing();

      act(() => result.current.speakAgain());
      act(() =>
        sttMock.callbacks.onError?.(
          new SttError('STT 연결 실패', 'connect_failed'),
          ERROR_META,
        ),
      );

      expect(onInputCancel).not.toHaveBeenCalled();
      expect(result.current.reviewing).toBe(true);
      expect(result.current.transcript).toBe('I went to the bitch.');
    });

    it('돌아온 문장을 보내면 처음 말한 시간 그대로 전달한다', () => {
      vi.useFakeTimers();
      const rendered = renderInput();
      act(() => rendered.result.current.pressMic());
      act(() => vi.advanceTimersByTime(2000));
      act(() =>
        sttMock.callbacks.onFinal?.('I went to the bitch.', FINAL_META),
      );
      act(() => rendered.result.current.speakAgain());
      act(() => vi.advanceTimersByTime(1000));
      act(() => rendered.result.current.cancelInput());

      act(() => rendered.result.current.submitReviewed());

      expect(rendered.onContent).toHaveBeenCalledWith(
        'I went to the bitch.',
        'VOICE',
        2000,
      );
      vi.useRealTimers();
    });

    it('처음 말하다 취소하면 지금처럼 말하기 전으로 돌아간다', () => {
      // 돌아갈 답이 없을 때는 대기로 — 다시 말하기에서만 직전 답으로 돌아간다
      const { result, onInputCancel } = renderReviewing();

      act(() => result.current.submitReviewed());
      act(() => result.current.resetForNextTurn());
      act(() => result.current.pressMic());
      act(() => result.current.cancelInput());

      expect(onInputCancel).toHaveBeenCalledTimes(1);
      expect(result.current.reviewing).toBe(false);
    });

    it('다시 말한 뒤 보내면 말한 시간은 다시 켠 순간부터 잰다', () => {
      vi.useFakeTimers();
      const { result, onContent } = renderReviewing();

      act(() => vi.advanceTimersByTime(4000));
      act(() => result.current.speakAgain());
      act(() => vi.advanceTimersByTime(1500));
      act(() =>
        sttMock.callbacks.onFinal?.('I went to the beach.', FINAL_META),
      );
      act(() => result.current.submitReviewed());

      expect(onContent).toHaveBeenCalledWith(
        'I went to the beach.',
        'VOICE',
        1500,
      );
      vi.useRealTimers();
    });

    it('「수정」을 누르면 인식된 문장이 채워진 입력창이 열린다', () => {
      const { result } = renderReviewing();

      act(() => result.current.editTranscript());

      expect(result.current.keyboardMode).toBe(true);
      expect(result.current.reviewing).toBe(true);
      expect(result.current.transcript).toBe('I went to the bitch.');
    });

    it('고쳐서 보내도 말한 답이라 VOICE와 말한 시간 그대로 전달한다', () => {
      // 타이핑(TEXT·0초)으로 보내면 말한 시간이 0초로 잡혀 지표가 깨진다 (LAN-550)
      vi.useFakeTimers();
      const rendered = renderInput();
      act(() => rendered.result.current.pressMic());
      act(() => vi.advanceTimersByTime(2000));
      act(() =>
        sttMock.callbacks.onFinal?.('I went to the bitch.', FINAL_META),
      );

      act(() => rendered.result.current.editTranscript());
      act(() =>
        rendered.result.current.setTranscript(' I went to the beach. '),
      );
      act(() => rendered.result.current.submitText());

      expect(rendered.onContent).toHaveBeenCalledWith(
        'I went to the beach.',
        'VOICE',
        2000,
      );
      vi.useRealTimers();
    });

    it('입력창을 닫으면 고친 내용을 버리고 처음 인식된 문장으로 확인 단계에 돌아간다', () => {
      const { result, onInputCancel } = renderReviewing();

      act(() => result.current.editTranscript());
      act(() => result.current.setTranscript('something else'));
      act(() => result.current.closeTyping());

      expect(result.current.keyboardMode).toBe(false);
      expect(result.current.reviewing).toBe(true);
      expect(result.current.transcript).toBe('I went to the bitch.');
      expect(onInputCancel).not.toHaveBeenCalled();
    });

    it('키보드로 쓰던 입력창을 닫으면 지금처럼 입력을 취소한다', () => {
      const { result, onInputCancel } = renderInput();

      act(() => result.current.pressKeyboard());
      act(() => result.current.closeTyping());

      expect(result.current.keyboardMode).toBe(false);
      expect(onInputCancel).toHaveBeenCalledTimes(1);
    });

    it('고친 문장을 다 지우면 보내지 않는다', () => {
      const { result, onContent } = renderReviewing();

      act(() => result.current.editTranscript());
      act(() => result.current.setTranscript('   '));
      act(() => result.current.submitText());

      expect(onContent).not.toHaveBeenCalled();
    });

    it.each([
      ['그대로 보내면', false, 'send', false],
      ['고쳐서 보내면', true, 'send', true],
    ] as const)(
      '%s 어떻게 마무리했는지 계측한다',
      (_, edit, action, edited) => {
        const { result } = renderReviewing();

        if (edit) {
          act(() => result.current.editTranscript());
          act(() => result.current.setTranscript('I went to the beach.'));
        }
        act(() => result.current.submitReviewed());

        expect(trackMock).toHaveBeenCalledWith('Transcript Reviewed', {
          session_id: 1,
          turn_index: 0,
          action,
          edited,
          edit_opened: edit,
          review_ms: expect.any(Number),
        });
      },
    );

    it('다시 말하기도 계측한다 — 잘못 알아들은 빈도를 본다', () => {
      const { result } = renderReviewing();

      act(() => result.current.speakAgain());

      expect(trackMock).toHaveBeenCalledWith('Transcript Reviewed', {
        session_id: 1,
        turn_index: 0,
        action: 'retry',
        edited: false,
        edit_opened: false,
        review_ms: expect.any(Number),
      });
    });

    it('확인 화면에 머문 시간을 함께 남긴다 — 단계가 늘어 늦어지는지 본다', () => {
      vi.useFakeTimers();
      const { result } = renderReviewing();

      act(() => vi.advanceTimersByTime(2500));
      act(() => result.current.submitReviewed());

      expect(trackMock).toHaveBeenCalledWith(
        'Transcript Reviewed',
        expect.objectContaining({ review_ms: 2500 }),
      );
      vi.useRealTimers();
    });

    it('고치기를 열었다가 닫고 그대로 보내도 열어 봤다는 걸 남긴다', () => {
      const { result } = renderReviewing();

      act(() => result.current.editTranscript());
      act(() => result.current.closeTyping());
      act(() => result.current.submitReviewed());

      expect(trackMock).toHaveBeenCalledWith(
        'Transcript Reviewed',
        expect.objectContaining({ edited: false, edit_opened: true }),
      );
    });

    it('확인 화면에서 대화를 나가면 나갔다고 남긴다 — 늘어난 단계에서 이탈하는지 본다', () => {
      const { result } = renderReviewing();

      act(() => result.current.cancelInput());

      expect(trackMock).toHaveBeenCalledWith(
        'Transcript Reviewed',
        expect.objectContaining({ action: 'leave', edited: false }),
      );
    });

    it('확인 중에 입력을 취소하면(대화 나가기) 마이크를 건드리지 않고 대기로 되돌린다', () => {
      const { result, onInputCancel } = renderReviewing();

      act(() => result.current.cancelInput());

      expect(sttMock.abort).not.toHaveBeenCalled();
      expect(onInputCancel).toHaveBeenCalledTimes(1);
      expect(result.current.reviewing).toBe(false);
      expect(result.current.transcript).toBe('');
    });

    it('보내면 확인 단계를 닫는다 — 보낸 뒤 대기로 돌아와도 확인 화면이 남지 않게', () => {
      // 세션을 못 잡아 대기로 돌아오는 길은 다음 턴 준비를 거치지 않는다
      const { result } = renderReviewing();

      act(() => result.current.submitReviewed());

      expect(result.current.reviewing).toBe(false);
      expect(result.current.keyboardMode).toBe(false);
      expect(result.current.transcript).toBe('I went to the bitch.');
    });

    it('다시 말하다 앞 답으로 돌아오면 머문 시간은 돌아온 때부터 잰다', () => {
      vi.useFakeTimers();
      const { result } = renderReviewing();

      act(() => vi.advanceTimersByTime(4000));
      act(() => result.current.speakAgain());
      act(() => vi.advanceTimersByTime(3000));
      act(() => result.current.cancelInput());
      act(() => vi.advanceTimersByTime(1000));
      act(() => result.current.submitReviewed());

      expect(trackMock).toHaveBeenLastCalledWith(
        'Transcript Reviewed',
        expect.objectContaining({ action: 'send', review_ms: 1000 }),
      );
      vi.useRealTimers();
    });

    it('인식된 글에 거르는 글자가 섞여 있어도 손대지 않고 보내면 고치지 않은 것이다', () => {
      const { result } = renderReviewing('I went to the beach 😀');

      act(() => result.current.submitReviewed());

      expect(trackMock).toHaveBeenCalledWith(
        'Transcript Reviewed',
        expect.objectContaining({ action: 'send', edited: false }),
      );
    });

    it('다음 턴 준비는 확인 단계도 닫는다', () => {
      const { result } = renderReviewing();

      act(() => result.current.resetForNextTurn());

      expect(result.current.reviewing).toBe(false);
    });
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
