// 브라우저 SpeechRecognition 폴백 — 미지원·에러 분류·턴 종료 갈림길 검증
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MicPermissionDeniedError } from './errors';
import { startWebSpeech } from './web-speech-fallback';

class FakeRecognition {
  static instances: FakeRecognition[] = [];

  lang = '';
  continuous = false;
  interimResults = false;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  started = false;

  constructor() {
    FakeRecognition.instances.push(this);
  }

  start() {
    this.started = true;
  }

  stop() {
    this.onend?.();
  }
}

const makeHandlers = () => ({
  onInterim: vi.fn(),
  onFinal: vi.fn(),
  onError: vi.fn(),
});

const resultEvent = (items: [text: string, isFinal: boolean][]) => ({
  resultIndex: 0,
  results: Object.assign(
    { length: items.length },
    ...items.map(([transcript, isFinal], i) => ({
      [i]: { 0: { transcript }, isFinal },
    })),
  ),
});

const startWithFake = (options: { stopOnSilence?: boolean } = {}) => {
  const handlers = makeHandlers();
  startWebSpeech({
    ...handlers,
    lang: 'ko',
    stopOnSilence: options.stopOnSilence ?? true,
  });
  const recognition = FakeRecognition.instances.at(-1)!;
  return { recognition, ...handlers };
};

describe('startWebSpeech', () => {
  beforeEach(() => {
    FakeRecognition.instances = [];
    vi.stubGlobal('webkitSpeechRecognition', FakeRecognition);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('브라우저가 SpeechRecognition을 지원하지 않으면 에러를 던진다', () => {
    vi.unstubAllGlobals();

    expect(() =>
      startWebSpeech({ ...makeHandlers(), lang: 'ko', stopOnSilence: true }),
    ).toThrow('음성 인식을 지원하지 않습니다');
  });

  it('stopOnSilence를 끄면 침묵을 지나도 이어 듣는 연속 인식으로 시작한다', () => {
    const { recognition } = startWithFake({ stopOnSilence: false });

    expect(recognition.continuous).toBe(true);
  });

  it('확정 결과와 진행 중 결과를 이어붙여 onInterim으로 전달한다', () => {
    const { recognition, onInterim } = startWithFake();

    recognition.onresult?.(
      resultEvent([
        ['안녕하세요', true],
        ['저는', false],
      ]),
    );

    expect(onInterim).toHaveBeenLastCalledWith('안녕하세요 저는');
  });

  it('no-speech 에러는 실패가 아니라 정상 종료로 처리한다', () => {
    const { recognition, onFinal, onError } = startWithFake();

    recognition.onerror?.({ error: 'no-speech' });

    expect(onFinal).toHaveBeenCalledWith('');
    expect(onError).not.toHaveBeenCalled();
  });

  it('인식 오류가 나면 onError를 호출하고 뒤따르는 onend는 무시한다', () => {
    const { recognition, onFinal, onError } = startWithFake();

    recognition.onerror?.({ error: 'audio-capture' });
    recognition.onend?.();

    expect(onError).toHaveBeenCalledWith(
      new Error('음성 인식 오류: audio-capture'),
    );
    expect(onFinal).not.toHaveBeenCalled();
  });

  it('마이크 권한 거부(not-allowed)는 MicPermissionDeniedError로 통일한다', () => {
    const { recognition, onError } = startWithFake();

    recognition.onerror?.({ error: 'not-allowed' });

    expect(onError).toHaveBeenCalledWith(new MicPermissionDeniedError());
  });

  it('service-not-allowed는 권한 오류가 아닌 일반 인식 오류로 둔다', () => {
    const { recognition, onError } = startWithFake();

    recognition.onerror?.({ error: 'service-not-allowed' });

    expect(onError).toHaveBeenCalledWith(
      new Error('음성 인식 오류: service-not-allowed'),
    );
  });

  it('침묵으로 끝나면 누적 텍스트로 onFinal을 정확히 한 번 호출한다', () => {
    const { recognition, onFinal } = startWithFake();
    recognition.onresult?.(resultEvent([['안녕하세요', true]]));

    recognition.onend?.();
    recognition.onend?.();

    expect(onFinal).toHaveBeenCalledTimes(1);
    expect(onFinal).toHaveBeenCalledWith('안녕하세요');
  });
});
