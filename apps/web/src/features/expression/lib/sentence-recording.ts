// 발음 발화 녹음 전송 계층 — getUserMedia + MediaRecorder로 한 문장 녹음을 Blob으로 만든다 (React 무관)
import {
  pickRecordingMimeType,
  recordingFilename,
} from '../model/recording-format';

export interface SentenceRecording {
  blob: Blob;
  // BE가 확장자로 형식을 검증한다 — 실제 쓰인 mimeType에서 결정
  filename: string;
  // 녹음 중 관측한 최대 진폭(0~1) — 측정 불가 환경(AudioContext 없음)은 null
  peak: number | null;
}

// 무음 판정 임계 — 이보다 작으면 말소리가 담기지 않은 것으로 보고 업로드 전에 거른다.
// 측정 불가(null)면 서버 판정에 맡긴다
const SILENCE_PEAK = 0.02;

export const isSilentRecording = (recording: SentenceRecording): boolean =>
  recording.peak !== null && recording.peak < SILENCE_PEAK;

export interface RecordingSession {
  /** 확정 (완료 ■) — 남은 청크까지 모아 녹음 파일을 돌려준다 */
  stop: () => Promise<SentenceRecording>;
  /** 파기 (취소 X) — 결과 없이 즉시 정리된다 */
  abort: () => void;
}

/**
 * 발화 녹음 세션을 연다 — 마이크 캡처를 시작하고 stop() 시 녹음 파일을 돌려준다.
 *
 * @throws getUserMedia 거부·미지원 — 호출부(훅)가 권한 안내를 판단한다
 */
export const startSentenceRecording = async (): Promise<RecordingSession> => {
  if (
    typeof MediaRecorder === 'undefined' ||
    !navigator.mediaDevices?.getUserMedia
  ) {
    throw new Error('이 브라우저는 오디오 녹음을 지원하지 않습니다.');
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = pickRecordingMimeType((type) =>
    MediaRecorder.isTypeSupported(type),
  );
  const recorder = new MediaRecorder(
    stream,
    mimeType ? { mimeType } : undefined,
  );

  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  // 무음 감지용 레벨 미터 — 녹음과 병렬로 스트림 진폭의 최댓값을 기록한다.
  // rAF는 웹뷰에서 멈출 수 있어 인터벌로 샘플링한다. AudioContext가 없으면 측정을 포기한다(peak=null)
  let peak: number | null = null;
  let meterTimer: ReturnType<typeof setInterval> | null = null;
  let audioContext: AudioContext | null = null;
  if (typeof AudioContext !== 'undefined') {
    try {
      const context = new AudioContext();
      audioContext = context;
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      // iOS는 제스처 스택 밖에서 만든 컨텍스트를 suspended로 둘 수 있다 — 재개를 시도하고,
      // running이 아닌 동안의 샘플(전부 무음으로 보임)은 버려 peak를 null(측정 불가)로 유지한다
      if (context.state !== 'running') void context.resume().catch(() => {});
      meterTimer = setInterval(() => {
        if (context.state !== 'running') return;
        analyser.getByteTimeDomainData(samples);
        for (const value of samples) {
          const amplitude = Math.abs(value - 128) / 128;
          if (peak === null || amplitude > peak) peak = amplitude;
        }
      }, 200);
    } catch {
      peak = null;
    }
  }

  const releaseMic = () => {
    if (meterTimer) clearInterval(meterTimer);
    void audioContext?.close().catch(() => {});
    if (recorder.state !== 'inactive') recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
  };

  let finished = false;
  recorder.start();

  return {
    stop: () =>
      new Promise((resolve) => {
        finished = true;
        const settle = () => {
          // 요청한 mimeType과 실제 쓰인 값이 다를 수 있어 recorder 쪽을 신뢰한다
          const type = recorder.mimeType || mimeType || '';
          resolve({
            blob: new Blob(chunks, type ? { type } : undefined),
            filename: recordingFilename(type),
            peak,
          });
        };
        // 트랙이 먼저 죽는 등(장치 점유·분리) 이미 멈춘 recorder는 onstop을 내지 않는다 — 즉시 확정
        if (recorder.state === 'inactive') {
          releaseMic();
          settle();
          return;
        }
        // onstop 시점엔 마지막 dataavailable까지 도착해 있다 (스펙 순서 보장)
        recorder.onstop = settle;
        releaseMic();
      }),
    abort: () => {
      if (finished) return;
      finished = true;
      recorder.ondataavailable = null;
      releaseMic();
    },
  };
};
