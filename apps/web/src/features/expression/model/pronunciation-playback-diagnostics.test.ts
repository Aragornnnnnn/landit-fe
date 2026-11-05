// 평가 응답과 재생 요청의 분리 보존 및 진단 기록 크기 제한을 검증한다.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import type { PronunciationAnalysis } from '../api/pronunciation';
import { createPronunciationDiagnostics } from './pronunciation-playback-diagnostics';

const prepare = () => {
  const analysis = {
    words: [
      {
        order: 2,
        word: 'went',
        startTimeMs: 1200,
        endTimeMs: 1500,
        userDisplay: 'private speech',
        nativeWordAudioUrl: 'https://private/audio',
      },
    ],
  } as PronunciationAnalysis;
  const diagnostics = createPronunciationDiagnostics({
    expressionId: 1946,
    requestedAt: '2026-11-05T07:33:00Z',
    analysis,
    recording: {
      blob: new Blob(['private audio'], { type: 'audio/mp4' }),
      filename: 'recording.m4a',
      peak: 0.5,
    },
  });
  return { analysis, diagnostics };
};

describe('발음 재생 진단', () => {
  it('화면의 구간 값이 바뀌어도 서버 응답 원본과 실제 요청값을 따로 보존한다', () => {
    const { analysis, diagnostics } = prepare();
    analysis.words[0]!.startTimeMs = 2200;

    diagnostics.startPlayback(2, { startMs: 2200, endMs: 2500 });
    const report = JSON.parse(diagnostics.export());

    expect(report.responseWords[0].startTimeMs).toBe(1200);
    expect(report.playbacks[0].requestedSegment.startMs).toBe(2200);
    expect(report.playbacks[0].order).toBe(2);
    expect(report.recording).toEqual({ mimeType: 'audio/mp4', bytes: 13 });
    expect(diagnostics.export()).not.toMatch(
      /private audio|private speech|https:\/\/private/,
    );
  });

  it('이전 평가의 재생 이벤트가 늦게 도착해도 새 평가에 섞이지 않는다', () => {
    const previous = prepare().diagnostics;
    const capture = previous.startPlayback(2, { startMs: 1200, endMs: 1500 });
    const next = prepare().diagnostics;

    capture({
      event: 'seeked',
      elapsedMs: 10,
      currentTimeMs: 1250,
    } as Parameters<typeof capture>[0]);

    expect(JSON.parse(next.export()).playbacks).toEqual([]);
    expect(
      JSON.parse(previous.export()).playbacks[0].events[0].currentTimeMs,
    ).toBe(1250);
  });

  it('오래 반복 재생해도 최근 8회와 각 회차의 시작 및 마지막 이벤트만 유지한다', () => {
    const { diagnostics } = prepare();

    for (let play = 0; play < 10; play++) {
      const capture = diagnostics.startPlayback(null);
      for (let event = 0; event < 200; event++) {
        capture({ event: 'sample', elapsedMs: event } as Parameters<
          typeof capture
        >[0]);
      }
    }
    const report = JSON.parse(diagnostics.export());

    expect(report.playbacks).toHaveLength(8);
    expect(report.droppedPlaybacks).toBe(2);
    expect(report.playbacks[0].events).toHaveLength(160);
    expect(report.playbacks[0].events[0].elapsedMs).toBe(0);
    expect(report.playbacks[0].events.at(-1).elapsedMs).toBe(199);
    expect(report.playbacks[0].droppedEvents).toBe(40);
  });
});
