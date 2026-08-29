// 발음 발화 녹음 전송 계층 — getUserMedia + MediaRecorder로 한 문장 녹음을 Blob으로 만든다 (React 무관)
import {
  pickRecordingMimeType,
  recordingFilename,
} from '../model/recording-format';

export interface SentenceRecording {
  blob: Blob;
  // BE가 확장자로 형식을 검증한다 — 실제 쓰인 mimeType에서 결정
  filename: string;
}

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

  const releaseMic = () => {
    if (recorder.state !== 'inactive') recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
  };

  let finished = false;
  recorder.start();

  return {
    stop: () =>
      new Promise((resolve) => {
        finished = true;
        // onstop 시점엔 마지막 dataavailable까지 도착해 있다 (스펙 순서 보장)
        recorder.onstop = () => {
          // 요청한 mimeType과 실제 쓰인 값이 다를 수 있어 recorder 쪽을 신뢰한다
          const type = recorder.mimeType || mimeType || '';
          resolve({
            blob: new Blob(chunks, type ? { type } : undefined),
            filename: recordingFilename(type),
          });
        };
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
