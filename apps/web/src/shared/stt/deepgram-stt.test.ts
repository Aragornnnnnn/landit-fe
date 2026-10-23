// Deepgram STT 전송 계층 — 미지원 폴백 유도·트랜스크립트 누적·턴 종료 갈림길 검증
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { startDeepgramStt } from './deepgram-stt';

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static instances: FakeWebSocket[] = [];

  readyState = 0;
  sent: unknown[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(data: unknown) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3;
  }

  // 테스트 헬퍼 — 서버 동작을 흉내낸다
  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  receive(message: unknown) {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
}

class FakeMediaRecorder {
  static isTypeSupported = () => true;
  static instances: FakeMediaRecorder[] = [];

  state = 'recording';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;

  constructor() {
    FakeMediaRecorder.instances.push(this);
  }

  start() {}
  stop() {
    this.state = 'inactive';
  }

  // 테스트 헬퍼 — 실제 stop()처럼 마지막 조각(dataavailable)이 비동기로 온 뒤 stop 이벤트가 뒤따른다
  finishStop(lastChunk = 'tail') {
    this.ondataavailable?.({ data: new Blob([lastChunk]) });
    this.onstop?.();
  }
}

const FINALIZE = JSON.stringify({ type: 'Finalize' });
const CLOSE_STREAM = JSON.stringify({ type: 'CloseStream' });

const makeHandlers = () => ({
  onInterim: vi.fn(),
  onFinal: vi.fn(),
  onError: vi.fn(),
});

const startWithFakes = async (options: { stopOnSilence?: boolean } = {}) => {
  const handlers = makeHandlers();
  const session = await startDeepgramStt({
    ...handlers,
    lang: 'ko',
    endpointingMs: 2000,
    stopOnSilence: options.stopOnSilence ?? true,
  });
  const ws = FakeWebSocket.instances.at(-1)!;
  return { session, ws, ...handlers };
};

describe('startDeepgramStt', () => {
  let trackStop: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    FakeWebSocket.instances = [];
    FakeMediaRecorder.instances = [];
    trackStop = vi.fn();
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
    vi.stubGlobal('WebSocket', FakeWebSocket);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ token: 'temp-token' }),
      })),
    );
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn(async () => ({
          getTracks: () => [{ stop: trackStop }],
        })),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('MediaRecorder가 없는 환경이면 폴백을 유도하는 에러를 던진다', async () => {
    vi.stubGlobal('MediaRecorder', undefined);

    await expect(
      startDeepgramStt({
        ...makeHandlers(),
        lang: 'ko',
        endpointingMs: 2000,
        stopOnSilence: true,
      }),
    ).rejects.toThrow('실시간 오디오 캡처');
  });

  it('토큰 발급이 실패하면 마이크 스트림을 정리하고 에러를 던진다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500 })),
    );

    await expect(
      startDeepgramStt({
        ...makeHandlers(),
        lang: 'ko',
        endpointingMs: 2000,
        stopOnSilence: true,
      }),
    ).rejects.toThrow('토큰 발급 실패');

    expect(trackStop).toHaveBeenCalled();
  });

  it('소켓 생성이 실패해도 마이크 스트림을 정리하고 에러를 던진다', async () => {
    vi.stubGlobal(
      'WebSocket',
      class {
        constructor() {
          throw new Error('mixed content');
        }
      },
    );

    await expect(
      startDeepgramStt({
        ...makeHandlers(),
        lang: 'ko',
        endpointingMs: 2000,
        stopOnSilence: true,
      }),
    ).rejects.toThrow('mixed content');

    expect(trackStop).toHaveBeenCalled();
  });

  it('WS가 열리기 전 녹음된 앞부분 오디오는 버퍼했다가 open 시 흘려보낸다', async () => {
    const { ws } = await startWithFakes();
    const recorder = FakeMediaRecorder.instances.at(-1)!;

    // WS가 아직 안 열린 사이 도착한 앞부분 청크 — 유실 대신 버퍼된다
    recorder.ondataavailable?.({ data: new Blob(['early-1']) });
    recorder.ondataavailable?.({ data: new Blob(['early-2']) });
    expect(ws.sent).toHaveLength(0);

    // open 시 버퍼된 앞부분을 순서대로 흘려보낸다
    ws.open();
    expect(ws.sent).toHaveLength(2);

    // 이후 청크는 곧바로 전송된다
    recorder.ondataavailable?.({ data: new Blob(['live']) });
    expect(ws.sent).toHaveLength(3);
  });

  it('확정 전 결과는 넘기지 않고 확정된 구간만 onInterim으로 전달한다', async () => {
    const { ws, onInterim } = await startWithFakes();
    ws.open();

    ws.receive({
      type: 'Results',
      is_final: true,
      channel: { alternatives: [{ transcript: '안녕하세요' }] },
    });
    ws.receive({
      type: 'Results',
      is_final: false,
      channel: { alternatives: [{ transcript: '저는' }] },
    });

    // 글자는 확정된 것만, 확정 전 말이 남아 있다는 사실만 함께 알린다
    expect(onInterim).toHaveBeenLastCalledWith('안녕하세요', true);
    expect(onInterim).not.toHaveBeenCalledWith(
      expect.stringContaining('저는'),
      expect.anything(),
    );
  });

  it('남은 말이 확정되면 확정 전 말이 없다고 알린다', async () => {
    const { ws, onInterim } = await startWithFakes();
    ws.open();

    ws.receive({
      type: 'Results',
      is_final: false,
      channel: { alternatives: [{ transcript: 'I went' }] },
    });
    expect(onInterim).toHaveBeenLastCalledWith('', true);

    ws.receive({
      type: 'Results',
      is_final: true,
      channel: { alternatives: [{ transcript: 'I went to the park' }] },
    });
    expect(onInterim).toHaveBeenLastCalledWith('I went to the park', false);
  });

  it('UtteranceEnd가 오면 누적 텍스트로 onFinal을 정확히 한 번 호출하고 마이크를 끈다', async () => {
    const { ws, onFinal } = await startWithFakes();
    ws.open();
    ws.receive({
      type: 'Results',
      is_final: true,
      channel: { alternatives: [{ transcript: '안녕하세요' }] },
    });

    ws.receive({ type: 'UtteranceEnd' });
    ws.receive({ type: 'UtteranceEnd' });

    expect(onFinal).toHaveBeenCalledTimes(1);
    expect(onFinal).toHaveBeenCalledWith(
      '안녕하세요',
      expect.objectContaining({ endReason: 'utterance_end' }),
    );
    expect(trackStop).toHaveBeenCalled();
  });

  it('완료하면 마지막 음성 조각을 보낸 뒤에 Finalize와 CloseStream을 보낸다', async () => {
    const { session, ws } = await startWithFakes({ stopOnSilence: false });
    const recorder = FakeMediaRecorder.instances.at(-1)!;
    ws.open();

    session.stop();
    // 녹음기가 마지막 조각을 내기 전에는 확정 요청을 보내지 않는다
    expect(ws.sent).not.toContainEqual(FINALIZE);

    recorder.finishStop('tail');

    expect(ws.sent.at(-3)).toBeInstanceOf(Blob);
    expect(ws.sent.slice(-2)).toEqual([FINALIZE, CLOSE_STREAM]);
  });

  it('연결 준비 중에 완료해도 녹음한 음성을 버리지 않고 연결 뒤 보내서 확정한다', async () => {
    const { session, ws, onFinal } = await startWithFakes({
      stopOnSilence: false,
    });
    const recorder = FakeMediaRecorder.instances.at(-1)!;
    recorder.ondataavailable?.({ data: new Blob(['early']) });

    session.stop();
    recorder.finishStop('tail');
    expect(onFinal).not.toHaveBeenCalled();

    ws.open();
    expect(ws.sent).toHaveLength(4);
    expect(ws.sent.slice(-2)).toEqual([FINALIZE, CLOSE_STREAM]);

    ws.receive({
      type: 'Results',
      is_final: true,
      channel: { alternatives: [{ transcript: '늦게 연결돼도 남는 말' }] },
    });
    ws.receive({ type: 'Metadata' });

    expect(onFinal).toHaveBeenCalledTimes(1);
    expect(onFinal).toHaveBeenCalledWith(
      '늦게 연결돼도 남는 말',
      expect.objectContaining({ endReason: 'metadata' }),
    );
  });

  it('완료 뒤 from_finalize 없이 Metadata만 와도 턴을 끝낸다', async () => {
    const { session, ws, onFinal } = await startWithFakes({
      stopOnSilence: false,
    });
    ws.open();

    session.stop();
    FakeMediaRecorder.instances.at(-1)!.finishStop();
    ws.receive({ type: 'Metadata' });

    expect(onFinal).toHaveBeenCalledTimes(1);
  });

  it('완료 뒤 서버가 연결을 닫으면 오류가 아니라 정상 종료로 처리한다', async () => {
    const { session, ws, onFinal, onError } = await startWithFakes({
      stopOnSilence: false,
    });
    ws.open();
    ws.receive({
      type: 'Results',
      is_final: true,
      channel: { alternatives: [{ transcript: '끝까지 한 말' }] },
    });

    session.stop();
    FakeMediaRecorder.instances.at(-1)!.finishStop();
    ws.onclose?.();

    expect(onError).not.toHaveBeenCalled();
    expect(onFinal).toHaveBeenCalledWith(
      '끝까지 한 말',
      expect.objectContaining({ endReason: 'closed' }),
    );
  });

  it('완료 뒤 응답이 오지 않으면 받은 데까지 제출하지 않고 타임아웃 오류를 낸다', async () => {
    vi.useFakeTimers();
    const { session, ws, onFinal, onError } = await startWithFakes({
      stopOnSilence: false,
    });
    ws.open();
    ws.receive({
      type: 'Results',
      is_final: true,
      channel: { alternatives: [{ transcript: '앞부분만' }] },
    });

    session.stop();
    FakeMediaRecorder.instances.at(-1)!.finishStop();
    vi.advanceTimersByTime(3000);

    expect(onFinal).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'SttError', reason: 'timeout' }),
    );
    expect(trackStop).toHaveBeenCalled();
  });

  it('연결이 열리기 전에 실패하면 연결 실패로 구분해 알린다', async () => {
    const { ws, onError } = await startWithFakes();

    ws.onerror?.();

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'connect_failed' }),
    );
  });

  it('결과에 엔진·연결 준비 시간·완료 뒤 대기 시간을 함께 넘긴다', async () => {
    vi.useFakeTimers();
    const { session, ws, onFinal } = await startWithFakes({
      stopOnSilence: false,
    });
    vi.advanceTimersByTime(300);
    ws.open();

    session.stop();
    FakeMediaRecorder.instances.at(-1)!.finishStop();
    vi.advanceTimersByTime(500);
    ws.receive({
      type: 'Results',
      is_final: true,
      from_finalize: true,
      channel: { alternatives: [{ transcript: '' }] },
    });

    expect(onFinal).toHaveBeenCalledWith('', {
      engine: 'deepgram',
      endReason: 'finalize',
      connectMs: 300,
      finalizeWaitMs: 500,
    });
  });

  it('stopOnSilence를 끄면 침묵 자동 종료 파라미터 없이 연결한다', async () => {
    const { ws } = await startWithFakes({ stopOnSilence: false });

    expect(ws.url).toContain('endpointing=false');
    expect(ws.url).not.toContain('utterance_end_ms');
  });

  it('stopOnSilence가 꺼져 있으면 침묵이 지나도 발화가 이어진다', async () => {
    const { ws, onInterim, onFinal } = await startWithFakes({
      stopOnSilence: false,
    });
    ws.open();
    ws.receive({
      type: 'Results',
      is_final: true,
      channel: { alternatives: [{ transcript: '첫 문장' }] },
    });

    // 침묵 후 다시 말해도 (UtteranceEnd 없음) 누적이 계속된다
    ws.receive({
      type: 'Results',
      is_final: true,
      channel: { alternatives: [{ transcript: '둘째 문장' }] },
    });

    expect(onFinal).not.toHaveBeenCalled();
    expect(onInterim).toHaveBeenLastCalledWith('첫 문장 둘째 문장', false);
  });

  it('stop() 후 from_finalize 결과가 오면 타임아웃을 기다리지 않고 즉시 턴을 종료한다', async () => {
    const { session, ws, onFinal } = await startWithFakes({
      stopOnSilence: false,
    });
    ws.open();
    ws.receive({
      type: 'Results',
      is_final: true,
      channel: { alternatives: [{ transcript: '마지막 문장' }] },
    });

    session.stop();
    FakeMediaRecorder.instances.at(-1)!.finishStop();
    ws.receive({
      type: 'Results',
      is_final: true,
      from_finalize: true,
      channel: { alternatives: [{ transcript: '' }] },
    });

    expect(onFinal).toHaveBeenCalledTimes(1);
    expect(onFinal).toHaveBeenCalledWith('마지막 문장', expect.anything());
  });

  it('abort()는 onFinal 없이 즉시 자원을 정리한다', async () => {
    const { session, ws, onFinal } = await startWithFakes();
    ws.open();
    ws.receive({
      type: 'Results',
      is_final: true,
      channel: { alternatives: [{ transcript: '취소될 말' }] },
    });

    session.abort();

    expect(onFinal).not.toHaveBeenCalled();
    expect(trackStop).toHaveBeenCalled();
    // 파기 후엔 어떤 서버 이벤트가 와도 결과가 나가지 않는다
    ws.receive({ type: 'UtteranceEnd' });
    expect(onFinal).not.toHaveBeenCalled();
  });

  it('stop()의 확정 대기 중 abort하면 타임아웃이 지나도 결과가 나가지 않는다', async () => {
    // 완료(■) 직후 마음을 바꿔 X를 누른 경우 — 확정보다 파기가 이긴다
    vi.useFakeTimers();
    const { session, ws, onFinal } = await startWithFakes();
    ws.open();

    session.stop();
    FakeMediaRecorder.instances.at(-1)!.finishStop();
    session.abort();
    vi.advanceTimersByTime(3000);

    expect(onFinal).not.toHaveBeenCalled();
  });

  it('연결이 열리기 전에 abort하면 CONNECTING 소켓도 닫는다', async () => {
    const { session, ws, onFinal } = await startWithFakes(); // open() 안 함 — 연결 중

    session.abort();

    expect(ws.readyState).toBe(3); // closed
    expect(trackStop).toHaveBeenCalled();
    expect(onFinal).not.toHaveBeenCalled();
  });

  it('토큰 요청 자체가 실패(네트워크)해도 마이크 스트림을 정리한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );

    await expect(
      startDeepgramStt({
        ...makeHandlers(),
        lang: 'ko',
        endpointingMs: 2000,
        stopOnSilence: true,
      }),
    ).rejects.toThrow('network down');

    expect(trackStop).toHaveBeenCalled();
  });

  it('세션 도중 연결이 끊기면 onError를 호출한다', async () => {
    const { ws, onError, onFinal } = await startWithFakes();
    ws.open();

    ws.onclose?.();

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'closed' }),
    );
    expect(onFinal).not.toHaveBeenCalled();
  });
});
