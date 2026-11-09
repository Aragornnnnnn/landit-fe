// 단어 오디오가 서버 구간 안의 PCM만 포함하는지 검증한다.
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createWordClips } from './word-playback';

const recording = new Blob(['recording'], { type: 'audio/mp4' });
const segment = { order: 2, startTimeMs: 40, endTimeMs: 100 };
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

describe('createWordClips', () => {
  it('녹음을 한 번 디코딩해 각 단어에 해당하는 샘플만 WAV로 만든다', async () => {
    const samples = new Float32Array(1600).fill(0.75);
    samples.fill(0.5, 640, 1600);
    const decode = vi.fn().mockResolvedValue({
      length: samples.length,
      sampleRate: 16000,
      numberOfChannels: 1,
      getChannelData: () => samples,
    });
    mockDecoder(decode);

    const clips = await createWordClips(recording, [
      { order: 1, startTimeMs: 0, endTimeMs: 40 },
      segment,
    ]);
    const clip = clips.get(2)!;
    const wav = new DataView(await clip.arrayBuffer());

    expect(decode).toHaveBeenCalledTimes(1);
    expect(clip.type).toBe('audio/wav');
    expect(wav.getUint32(0)).toBe(0x52494646);
    expect(wav.getUint32(24, true)).toBe(16000);
    expect(wav.getUint32(40, true)).toBe(960 * 2);
    expect(wav.byteLength).toBe(44 + 960 * 2);
    expect(wav.getInt16(44, true)).toBe(16384);
    expect(wav.getInt16(wav.byteLength - 2, true)).toBe(0);
  });

  it('녹음 범위 밖이나 유효하지 않은 단어는 재생 음원을 만들지 않는다', async () => {
    const samples = new Float32Array(1600);
    mockDecoder(async () => ({
      length: samples.length,
      sampleRate: 16000,
      numberOfChannels: 1,
      getChannelData: () => samples,
    }));

    const clips = await createWordClips(recording, [
      { order: 1, startTimeMs: null, endTimeMs: 60 },
      { order: 2, startTimeMs: 100, endTimeMs: 120 },
      { order: 3, startTimeMs: 90, endTimeMs: 80 },
      { order: 4, startTimeMs: 80, endTimeMs: 130 },
    ]);

    expect([...clips.keys()]).toEqual([4]);
    expect(clips.get(4)?.size).toBe(44 + 320 * 2);
  });

  it('브라우저가 녹음을 디코딩하지 못하면 잘못된 단어 음원을 만들지 않는다', async () => {
    mockDecoder(async () => {
      throw new Error('unsupported recording');
    });

    await expect(createWordClips(recording, [segment])).resolves.toEqual(
      new Map(),
    );
  });
});
