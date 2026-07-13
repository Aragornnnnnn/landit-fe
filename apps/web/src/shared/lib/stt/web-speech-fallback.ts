// 브라우저 SpeechRecognition 기반 STT 폴백 — Deepgram 실패/미지원(iOS WKWebView 등) 시 사용
import type { SttHandlers, SttSession } from './deepgram-stt';

// 표준 lib.dom에 없는 벤더 API라 필요한 부분만 최소 타입으로 선언
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const getRecognitionCtor = (): SpeechRecognitionCtor | undefined => {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

export interface WebSpeechOptions extends SttHandlers {
  lang: string;
  // false면 침묵을 지나도 이어 듣는 연속 인식 모드로 동작한다
  stopOnSilence: boolean;
}

// 미지원 시 throw
export const startWebSpeech = (options: WebSpeechOptions): SttSession => {
  const Ctor = getRecognitionCtor();
  if (!Ctor) throw new Error('브라우저가 음성 인식을 지원하지 않습니다.');

  const recognition = new Ctor();
  recognition.lang = options.lang;
  recognition.interimResults = true;
  recognition.continuous = !options.stopOnSilence;

  let accumulated = '';
  let finished = false;

  const finishTurn = () => {
    if (finished) return;
    finished = true;
    options.onFinal(accumulated.trim());
  };

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      if (result.isFinal)
        accumulated = `${accumulated} ${result[0].transcript}`.trim();
      else interim = `${interim} ${result[0].transcript}`.trim();
    }
    options.onInterim(`${accumulated} ${interim}`.trim());
  };

  recognition.onerror = (event) => {
    // 침묵/중단은 정상 종료로 처리
    if (event.error === 'no-speech' || event.error === 'aborted') {
      finishTurn();
      return;
    }
    if (finished) return;
    finished = true;
    options.onError(new Error(`음성 인식 오류: ${event.error}`));
  };

  // 침묵으로 자동 종료되거나 stop() 호출 시
  recognition.onend = () => finishTurn();

  recognition.start();

  return {
    stop: () => recognition.stop(),
  };
};
