// 발화 녹음 전송 계층 검증 — 미지원 차단·청크 조립·파기 시 마이크 반납
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isSilentRecording,
  startSentenceRecording,
} from './sentence-recording';

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

describe('startSentenceRecording — 비정상 종료', () => {
  it('트랙이 먼저 죽어 recorder가 이미 inactive여도 stop()이 즉시 확정된다', async () => {
    const session = await startSentenceRecording();
    const recorder = FakeMediaRecorder.instances[0];
    // 다른 앱의 장치 점유 등으로 recorder가 스스로 멈춘 상황 — onstop은 다시 오지 않는다
    recorder.ondataavailable?.({ data: new Blob(['early']) });
    recorder.state = 'inactive';

    const recording = await session.stop();

    expect(recording.blob.size).toBeGreaterThan(0);
    expect(recording.filename).toBe('recording.webm');
    expect(trackStop).toHaveBeenCalled();
  });
});

describe('isSilentRecording', () => {
  const recording = (peak: number | null) => ({
    blob: new Blob(['x']),
    filename: 'recording.webm',
    peak,
  });

  it('피크가 임계 미만이면 무음으로 판정한다', () => {
    expect(isSilentRecording(recording(0.005))).toBe(true);
  });

  it('말소리 수준의 피크면 무음이 아니다', () => {
    expect(isSilentRecording(recording(0.3))).toBe(false);
  });

  it('측정 불가(null)면 무음으로 판정하지 않는다 — 서버 판정에 맡긴다', () => {
    expect(isSilentRecording(recording(null))).toBe(false);
  });
});
