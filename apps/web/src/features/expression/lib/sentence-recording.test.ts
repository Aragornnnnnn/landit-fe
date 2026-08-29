// 발화 녹음 전송 계층 검증 — 미지원 차단·청크 조립·파기 시 마이크 반납
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { startSentenceRecording } from './sentence-recording';

class FakeMediaRecorder {
  static isTypeSupported = (type: string) => type === 'audio/webm';
  static instances: FakeMediaRecorder[] = [];

  state = 'recording';
  mimeType = 'audio/webm;codecs=opus';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;

  constructor() {
    FakeMediaRecorder.instances.push(this);
  }

  start() {}

  stop() {
    this.state = 'inactive';
    // 실제 브라우저 순서와 동일 — 남은 청크를 먼저 주고 onstop을 부른다
    this.ondataavailable?.({ data: new Blob(['chunk']) });
    this.onstop?.();
  }
}

let trackStop: ReturnType<typeof vi.fn>;

beforeEach(() => {
  FakeMediaRecorder.instances = [];
  trackStop = vi.fn();
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn(async () => ({
        getTracks: () => [{ stop: trackStop }],
      })),
    },
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('startSentenceRecording', () => {
  it('MediaRecorder가 없는 브라우저면 시작 전에 던진다', async () => {
    vi.stubGlobal('MediaRecorder', undefined);

    await expect(startSentenceRecording()).rejects.toThrow(
      '오디오 녹음을 지원하지 않습니다',
    );
  });

  it('stop하면 청크를 합친 blob과 실제 mimeType 기준 파일명을 돌려주고 마이크를 반납한다', async () => {
    const session = await startSentenceRecording();

    const recording = await session.stop();

    expect(recording.filename).toBe('recording.webm');
    expect(recording.blob.size).toBeGreaterThan(0);
    expect(recording.blob.type).toBe('audio/webm;codecs=opus');
    expect(trackStop).toHaveBeenCalled();
  });

  it('abort하면 결과 없이 마이크를 반납하고 이후 청크를 무시한다', async () => {
    const session = await startSentenceRecording();

    session.abort();

    const recorder = FakeMediaRecorder.instances[0];
    expect(recorder.state).toBe('inactive');
    expect(recorder.ondataavailable).toBeNull();
    expect(trackStop).toHaveBeenCalled();
  });
});
