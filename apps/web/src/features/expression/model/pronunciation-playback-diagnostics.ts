// 평가 회차별 서버 구간과 재생 관측값을 제한된 메모리에 보존하고 공유용 JSON으로 만든다.
import { getNativeContext } from '@/shared/bridge/native-context';

import type { PronunciationAnalysis } from '../api/pronunciation';
import type {
  AudioDiagnosticSink,
  AudioPlaybackSnapshot,
} from '../lib/audio-playback-diagnostics';
import type { SentenceRecording } from '../lib/sentence-recording';

type Segment = { startMs: number; endMs: number };
interface PlaybackTrace {
  id: number;
  startedAt: string;
  order: number | null;
  requestedSegment: Segment | null;
  events: AudioPlaybackSnapshot[];
  droppedEvents: number;
}

export const createPronunciationDiagnostics = ({
  expressionId,
  requestedAt,
  recording,
  analysis,
}: {
  expressionId: number;
  requestedAt: string;
  recording: SentenceRecording;
  analysis: PronunciationAnalysis;
}) => {
  const native = getNativeContext();
  const report = {
    schema: 'LAN-844-v1',
    evaluationId: crypto.randomUUID(),
    expressionId,
    requestedAt,
    responseReceivedAt: new Date().toISOString(),
    environment: {
      userAgent: navigator.userAgent,
      platform: native?.platform ?? 'browser',
      appVersion: native?.appVersion ?? null,
      buildNumber: native?.buildNumber ?? null,
      bridgeVersion: native?.bridgeVersion ?? null,
    },
    recording: { mimeType: recording.blob.type, bytes: recording.blob.size },
    // 원어민 음원 URL·사용자 발화·인증 정보는 보고서에 넣지 않는다.
    responseWords: analysis.words.map(
      ({ order, word, startTimeMs, endTimeMs }) => ({
        order,
        word,
        startTimeMs,
        endTimeMs,
      }),
    ),
    playbacks: [] as PlaybackTrace[],
    droppedPlaybacks: 0,
  };
  let sequence = 0;

  return {
    id: report.evaluationId,
    startPlayback: (
      order: number | null,
      segment?: Segment,
    ): AudioDiagnosticSink => {
      const trace: PlaybackTrace = {
        id: ++sequence,
        startedAt: new Date().toISOString(),
        order,
        requestedSegment: segment ? { ...segment } : null,
        events: [],
        droppedEvents: 0,
      };
      if (report.playbacks.length === 8) {
        report.playbacks.shift();
        report.droppedPlaybacks++;
      }
      report.playbacks.push(trace);
      return (event) => {
        if (trace.events.length === 160) {
          // 초기 seek 이벤트와 최근 종료 이벤트를 함께 남긴다.
          trace.events.splice(8, 1);
          trace.droppedEvents++;
        }
        trace.events.push({ ...event });
      };
    },
    export: () => JSON.stringify(report, null, 2),
  };
};

export type PronunciationDiagnostics = ReturnType<
  typeof createPronunciationDiagnostics
>;
