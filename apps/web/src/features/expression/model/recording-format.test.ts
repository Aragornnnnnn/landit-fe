// 녹음 mimeType 선택과 업로드 파일명 결정 검증 — BE가 파일명 확장자로 형식을 검증한다
import { describe, expect, it } from 'vitest';

import { pickRecordingMimeType, recordingFilename } from './recording-format';

describe('pickRecordingMimeType', () => {
  it('webm·mp4를 둘 다 지원하면 webm을 고른다 — 최신 크롬의 mp4는 opus 조합이라 피한다', () => {
    const picked = pickRecordingMimeType(
      (type) => type === 'audio/webm' || type === 'audio/mp4',
    );

    expect(picked).toBe('audio/webm');
  });

  it('webm 미지원이면 mp4로 폴백한다 — 사파리·iOS 경로(m4a)', () => {
    const picked = pickRecordingMimeType((type) => type === 'audio/mp4');

    expect(picked).toBe('audio/mp4');
  });

  it('후보를 전부 미지원이면 undefined — 브라우저 기본값에 맡긴다', () => {
    const picked = pickRecordingMimeType(() => false);

    expect(picked).toBeUndefined();
  });
});

describe('recordingFilename', () => {
  it.each([
    ['audio/mp4', 'recording.m4a'],
    ['audio/webm;codecs=opus', 'recording.webm'],
    ['audio/ogg;codecs=opus', 'recording.ogg'],
    ['audio/wav', 'recording.wav'],
    ['audio/mpeg', 'recording.mp3'],
  ])('%s 이면 %s 로 짓는다', (mimeType, filename) => {
    expect(recordingFilename(mimeType)).toBe(filename);
  });

  it('모르는 mimeType이면 webm으로 짓는다 — 크롬 계열 기본값', () => {
    expect(recordingFilename('')).toBe('recording.webm');
  });
});
