// 분석용 WAV 변환과 단어 오디오가 같은 PCM 시간축을 쓰는지 검증한다.
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createWordClips, toAnalysisRecording } from './word-playback';

const recording = new Blob(['recording'], { type: 'audio/mp4' });
const fakeAudio = (samples: Float32Array, sampleRate = 16000) =>
  ({
    length: samples.length,
    sampleRate,
    numberOfChannels: 1,
    getChannelData: () => samples,
  }) as unknown as AudioBuffer;
const mockDecoder = (
  decodeAudioData: (bytes: ArrayBuffer) => Promise<unknown>,
) =>
  vi.stubGlobal(
    'OfflineAudioContext',
    class {
      decodeAudioData = decodeAudioData;
    },
  );

afterEach(() => vi.unstubAllGlobals());

describe('toAnalysisRecording', () => {
  it.each(['recording.m4a', 'recording.webm'])(
    '%s 녹음을 한 번 디코딩해 전체 샘플을 페이드 없이 WAV로 올린다',
    async (filename) => {
      const samples = new Float32Array(9600).fill(0.5);
      const decode = vi.fn().mockResolvedValue(fakeAudio(samples));
      mockDecoder(decode);

      const result = await toAnalysisRecording({
        filename,
        blob: recording,
        peak: 0.5,
      });
      const wav = new DataView(await result.blob.arrayBuffer());

      expect(decode).toHaveBeenCalledTimes(1);
      expect(result.filename).toBe('recording.wav');
      expect(result.peak).toBe(0.5);
      expect(result.audio?.length).toBe(9600);
      expect(wav.getUint32(24, true)).toBe(16000);
      expect(wav.getUint32(40, true)).toBe(9600 * 2);
      expect(wav.getInt16(wav.byteLength - 2, true)).toBe(16384);
    },
  );

  it('디코딩에 실패하면 원본 녹음을 올리고 단어 음원용 PCM은 없다', async () => {
    const input = { filename: 'recording.m4a', blob: recording, peak: null };
    mockDecoder(async () => {
      throw new Error('unsupported recording');
    });

    await expect(toAnalysisRecording(input)).resolves.toEqual({
      ...input,
      audio: null,
    });
  });

  it('녹음 길이 제한을 넘으면 원본 녹음을 올리고 단어 음원용 PCM은 없다', async () => {
    const input = { filename: 'recording.m4a', blob: recording, peak: 0.5 };
    mockDecoder(async () => fakeAudio(new Float32Array(16000 * 31)));

    await expect(toAnalysisRecording(input)).resolves.toEqual({
      ...input,
      audio: null,
    });
  });
});

describe('createWordClips', () => {
  it('분석에 올린 PCM에서 각 단어에 해당하는 샘플만 WAV로 만든다', async () => {
    const samples = new Float32Array(1600).fill(0.75);
    samples.fill(0.5, 640, 1600);

    const clips = createWordClips(fakeAudio(samples), [
      { order: 1, startTimeMs: 0, endTimeMs: 40 },
      { order: 2, startTimeMs: 40, endTimeMs: 100 },
    ]);
    const clip = clips.get(2)!;
    const wav = new DataView(await clip.arrayBuffer());

    expect(clip.type).toBe('audio/wav');
    expect(wav.getUint32(0)).toBe(0x52494646);
    expect(wav.getUint32(24, true)).toBe(16000);
    expect(wav.getUint32(40, true)).toBe(960 * 2);
    expect(wav.byteLength).toBe(44 + 960 * 2);
    expect(wav.getInt16(44, true)).toBe(16384);
    expect(wav.getInt16(wav.byteLength - 2, true)).toBe(0);
  });

  it('녹음 범위 밖이나 유효하지 않은 단어는 재생 음원을 만들지 않는다', () => {
    const clips = createWordClips(fakeAudio(new Float32Array(1600)), [
      { order: 1, startTimeMs: null, endTimeMs: 60 },
      { order: 2, startTimeMs: 100, endTimeMs: 120 },
      { order: 3, startTimeMs: 90, endTimeMs: 80 },
      { order: 4, startTimeMs: 80, endTimeMs: 130 },
    ]);

    expect([...clips.keys()]).toEqual([4]);
    expect(clips.get(4)?.size).toBe(44 + 320 * 2);
  });

  it('분석에 쓴 PCM이 없으면 단어 음원을 만들지 않는다', () => {
    expect(
      createWordClips(null, [{ order: 1, startTimeMs: 0, endTimeMs: 40 }]),
    ).toEqual(new Map());
  });
});
