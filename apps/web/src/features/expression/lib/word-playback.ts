// 내 녹음에서 서버가 지정한 단어 구간을 독립 WAV로 만든다.
import type { PronunciationWord } from '../api/pronunciation';
import type { SentenceRecording } from './sentence-recording';

type WordSpan = Pick<PronunciationWord, 'order' | 'startTimeMs' | 'endTimeMs'>;

// 녹음 음질을 유지하는 샘플레이트 — 30초 모노 WAV가 약 2.9MB라 백엔드 업로드 제한(10MiB)에 닿지 않는다.
const SAMPLE_RATE = 48_000;
// AI의 녹음 길이 제한을 넘는 녹음은 변환하지 않는다.
const MAX_AUDIO_SECONDS = 30;
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

const encodeWav = (
  audio: AudioBuffer,
  start: number,
  end: number,
  fadeOutMs = 0,
) => {
  const { numberOfChannels, sampleRate } = audio;
  const frames = end - start;
  const dataBytes = frames * numberOfChannels * 2;
  const wav = new DataView(new ArrayBuffer(WAV_HEADER_BYTES + dataBytes));
  writeWavHeader(wav, numberOfChannels, sampleRate, dataBytes);
  const fadeFrames = Math.min(frames - 1, (sampleRate * fadeOutMs) / 1000);

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

const decodeRecording = async (recording: Blob) => {
  const decoder = new OfflineAudioContext(1, 1, SAMPLE_RATE);
  return decoder.decodeAudioData(await recording.arrayBuffer());
};

// 분석에 올린 녹음과 그 PCM — PCM이 없으면 단어 음원을 만들지 않는다.
export type AnalysisRecording = SentenceRecording & {
  audio: AudioBuffer | null;
};

/**
 * 분석과 단어 재생이 같은 시간축을 쓰도록 녹음을 한 번 디코딩해 WAV로 올린다.
 * 압축 녹음(AAC·Opus)은 앞부분을 버리는 양이 디코더마다 달라 서버와 브라우저의 단어 위치가 어긋난다.
 */
export const toAnalysisRecording = async (
  recording: SentenceRecording,
): Promise<AnalysisRecording> => {
  try {
    const audio = await decodeRecording(recording.blob);
    if (audio.length > audio.sampleRate * MAX_AUDIO_SECONDS) {
      return { ...recording, audio: null };
    }
    return {
      ...recording,
      blob: encodeWav(audio, 0, audio.length),
      filename: 'recording.wav',
      audio,
    };
  } catch {
    // 디코딩이 실패해도 원본 녹음으로 분석하고 전체 듣기는 그대로 재생할 수 있다.
    return { ...recording, audio: null };
  }
};

export const createWordClips = (
  audio: AudioBuffer | null,
  words: WordSpan[],
) => {
  const clips = new Map<number, Blob>();
  if (!audio) return clips;

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
      clips.set(order, encodeWav(audio, start, end, FADE_OUT_MS));
    }
  }
  return clips;
};
