// 오디오 동작을 바꾸지 않고 미디어 이벤트와 프레임 지연을 관측한다.
export interface AudioPlaybackSnapshot {
  event: string;
  elapsedMs: number;
  currentTimeMs: number | null;
  durationMs: number | null;
  playbackRate: number;
  paused: boolean;
  seeking: boolean;
  readyState: number;
  networkState: number;
  visibility: DocumentVisibilityState;
  errorCode: number | null;
  maxFrameGapMs: number;
  sinceLastFrameMs: number;
  seekableMs: [number | null, number | null][];
}

export type AudioDiagnosticSink = (snapshot: AudioPlaybackSnapshot) => void;
const milliseconds = (seconds: number) =>
  Number.isFinite(seconds) ? Math.round(seconds * 1000) : null;
const MEDIA_EVENTS = [
  'loadedmetadata',
  'loadeddata',
  'seeking',
  'seeked',
  'playing',
  'timeupdate',
  'pause',
  'ended',
  'waiting',
  'stalled',
  'error',
  'ratechange',
] as const;

export const observeAudioPlayback = (
  audio: HTMLAudioElement,
  sink?: AudioDiagnosticSink,
) => {
  const started = performance.now();
  let lastFrame = started;
  let lastSample = started;
  let maxFrameGapMs = 0;
  let disposed = false;

  const capture = (event: string) => {
    if (!sink || disposed) return;
    try {
      sink({
        event,
        elapsedMs: Math.round(performance.now() - started),
        currentTimeMs: milliseconds(audio.currentTime),
        durationMs: milliseconds(audio.duration),
        playbackRate: audio.playbackRate,
        paused: audio.paused,
        seeking: audio.seeking,
        readyState: audio.readyState,
        networkState: audio.networkState,
        visibility: document.visibilityState,
        errorCode: audio.error?.code ?? null,
        maxFrameGapMs,
        sinceLastFrameMs: Math.round(performance.now() - lastFrame),
        seekableMs: Array.from(
          { length: Math.min(audio.seekable?.length ?? 0, 3) },
          (_, index) => [
            milliseconds(audio.seekable.start(index)),
            milliseconds(audio.seekable.end(index)),
          ],
        ),
      });
    } catch {
      /* 진단 실패가 재생·종료를 막지 않게 한다. */
    }
  };
  const onEvent = (event: Event) => capture(event.type);
  if (sink) {
    for (const event of MEDIA_EVENTS) audio.addEventListener(event, onEvent);
    document.addEventListener('visibilitychange', onEvent);
  }

  return {
    capture,
    sample: () => {
      if (!sink || disposed) return;
      const now = performance.now();
      maxFrameGapMs = Math.max(maxFrameGapMs, Math.round(now - lastFrame));
      lastFrame = now;
      if (now - lastSample < 250) return;
      lastSample = now;
      capture('sample');
    },
    dispose: (reason: string) => {
      capture(reason);
      disposed = true;
      for (const event of MEDIA_EVENTS)
        audio.removeEventListener(event, onEvent);
      document.removeEventListener('visibilitychange', onEvent);
    },
  };
};
