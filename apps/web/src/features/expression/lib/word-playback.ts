// 내 녹음에서 서버가 지정한 단어 구간을 독립 WAV로 만든다.
import type { PronunciationWord } from '../api/pronunciation';
import type { SentenceRecording } from './sentence-recording';

type WordSpan = Pick<PronunciationWord, 'order' | 'startTimeMs' | 'endTimeMs'>;

const CLIP_SAMPLE_RATE = 16_000;
const RECORDING_SAMPLE_RATE = 48_000;
// 백엔드의 업로드 크기와 AI의 녹음 길이 제한을 넘는 변환은 생략한다.
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
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

const decodeRecording = async (recording: Blob, sampleRate: number) => {
  const decoder = new OfflineAudioContext(1, 1, sampleRate);
  return decoder.decodeAudioData(await recording.arrayBuffer());
};

export const normalizeRecordingForPlayback = async (
  recording: SentenceRecording,
) => {
  if (recording.filename !== 'recording.m4a') return recording;

  try {
    // AAC 앞부분을 버리는 양이 디코더마다 다르므로 분석과 재생에 동일한 PCM을 사용한다.
    const audio = await decodeRecording(recording.blob, RECORDING_SAMPLE_RATE);
    const bytes = WAV_HEADER_BYTES + audio.length * audio.numberOfChannels * 2;
    if (
      audio.length > audio.sampleRate * MAX_AUDIO_SECONDS ||
      bytes > MAX_AUDIO_BYTES
    ) {
      return recording;
    }
    return {
      ...recording,
      blob: encodeWav(audio, 0, audio.length),
      filename: 'recording.wav',
    };
  } catch {
    return recording;
  }
};

export const createWordClips = async (recording: Blob, words: WordSpan[]) => {
  const clips = new Map<number, Blob>();
  if (words.length === 0) return clips;

  let audio: AudioBuffer;
  try {
    audio = await decodeRecording(recording, CLIP_SAMPLE_RATE);
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
      clips.set(order, encodeWav(audio, start, end, FADE_OUT_MS));
    }
  }
  return clips;
};
