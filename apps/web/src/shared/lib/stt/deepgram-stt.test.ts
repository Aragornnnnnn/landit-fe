// Deepgram STT 전송 계층 — 미지원 폴백 유도·트랜스크립트 누적·턴 종료 갈림길 검증
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { startDeepgramStt } from './deepgram-stt';

class FakeWebSocket {
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

  constructor() {
    FakeMediaRecorder.instances.push(this);
  }

  start() {}
  stop() {
    this.state = 'inactive';
  }
}

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

  it('interim 결과가 오면 확정된 텍스트 뒤에 이어붙여 onInterim으로 전달한다', async () => {
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

    expect(onInterim).toHaveBeenLastCalledWith('안녕하세요 저는');
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
    expect(onFinal).toHaveBeenCalledWith('안녕하세요');
    expect(trackStop).toHaveBeenCalled();
  });

  it('stop() 후 UtteranceEnd가 안 오면 2초 뒤 강제로 턴을 종료한다', async () => {
    vi.useFakeTimers();
    const { session, ws, onFinal } = await startWithFakes();
    ws.open();

    session.stop();

    expect(ws.sent).toContainEqual(JSON.stringify({ type: 'Finalize' }));
    expect(onFinal).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);

    expect(onFinal).toHaveBeenCalledTimes(1);
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
    expect(onInterim).toHaveBeenLastCalledWith('첫 문장 둘째 문장');
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
    ws.receive({
      type: 'Results',
      is_final: true,
      from_finalize: true,
      channel: { alternatives: [{ transcript: '' }] },
    });

    expect(onFinal).toHaveBeenCalledTimes(1);
    expect(onFinal).toHaveBeenCalledWith('마지막 문장');
  });

  it('세션 도중 연결이 끊기면 onError를 호출한다', async () => {
    const { ws, onError, onFinal } = await startWithFakes();
    ws.open();

    ws.onclose?.();

    expect(onError).toHaveBeenCalledWith(new Error('STT 연결이 끊겼습니다.'));
    expect(onFinal).not.toHaveBeenCalled();
  });
});
