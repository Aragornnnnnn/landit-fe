// 내 녹음에서 서버가 지정한 단어 구간을 독립 WAV로 만든다.
import type { PronunciationWord } from '../api/pronunciation';

type WordSpan = Pick<PronunciationWord, 'order' | 'startTimeMs' | 'endTimeMs'>;

const SAMPLE_RATE = 16_000;
const FADE_OUT_MS = 20;
const WAV_HEADER_BYTES = 44;

const writeWavHeader = (
  wav: DataView,
  channels: number,
  sampleRate: number,
  dataBytes: number,
) => {
  const blockAlign = channels * 2;
  wav.setUint32(0, 0x52494646); // RIFF
  wav.setUint32(4, dataBytes + 36, true);
  wav.setUint32(8, 0x57415645); // WAVE
  wav.setUint32(12, 0x666d7420); // fmt
  wav.setUint32(16, 16, true);
  wav.setUint16(20, 1, true); // PCM
  wav.setUint16(22, channels, true);
  wav.setUint32(24, sampleRate, true);
  wav.setUint32(28, sampleRate * blockAlign, true);
  wav.setUint16(32, blockAlign, true);
  wav.setUint16(34, 16, true);
  wav.setUint32(36, 0x64617461); // data
  wav.setUint32(40, dataBytes, true);
};

const encodeClip = (audio: AudioBuffer, start: number, end: number) => {
  const { numberOfChannels, sampleRate } = audio;
  const frames = end - start;
  const dataBytes = frames * numberOfChannels * 2;
  const wav = new DataView(new ArrayBuffer(WAV_HEADER_BYTES + dataBytes));
  writeWavHeader(wav, numberOfChannels, sampleRate, dataBytes);
  const fadeFrames = Math.min(frames - 1, (sampleRate * FADE_OUT_MS) / 1000);

  for (let channel = 0; channel < numberOfChannels; channel++) {
    const samples = audio.getChannelData(channel);
    for (let frame = 0; frame < frames; frame++) {
      const remaining = frames - frame - 1;
      const gain = remaining < fadeFrames ? remaining / fadeFrames : 1;
      const sample = Math.round(samples[start + frame]! * gain * 32768);
      const offset =
        WAV_HEADER_BYTES + (frame * numberOfChannels + channel) * 2;
      wav.setInt16(offset, Math.max(-32768, Math.min(32767, sample)), true);
    }
  }
  return new Blob([wav.buffer], { type: 'audio/wav' });
};

export const createWordClips = async (recording: Blob, words: WordSpan[]) => {
  const clips = new Map<number, Blob>();
  if (words.length === 0) return clips;

  let audio: AudioBuffer;
  try {
    const decoder = new OfflineAudioContext(1, 1, SAMPLE_RATE);
    audio = await decoder.decodeAudioData(await recording.arrayBuffer());
  } catch {
    // 디코딩이 실패해도 전체 녹음은 기존 방식으로 재생할 수 있다.
    return clips;
  }

  const samplesPerMs = audio.sampleRate / 1000;
  for (const { order, startTimeMs, endTimeMs } of words) {
    if (
      startTimeMs === null ||
      endTimeMs === null ||
      !Number.isFinite(startTimeMs) ||
      !Number.isFinite(endTimeMs)
    ) {
      continue;
    }
    const start = Math.ceil(startTimeMs * samplesPerMs);
    const end = Math.min(audio.length, Math.floor(endTimeMs * samplesPerMs));
    if (start >= 0 && start < end) {
      clips.set(order, encodeClip(audio, start, end));
    }
  }
  return clips;
};
