// Deepgram 실시간 STT 전송 계층 — getUserMedia 오디오를 WebSocket으로 보내고 트랜스크립트를 콜백으로 전달 (React 무관)

export interface SttHandlers {
  // 발화 중 실시간 미리보기 (계속 갱신됨)
  onInterim: (transcript: string) => void;
  // 턴 종료 — 침묵 감지(endpointing) 또는 stop() 호출 시 한 번
  onFinal: (transcript: string) => void;
  onError: (error: Error) => void;
}

export interface SttSession {
  stop: () => void;
}

export interface DeepgramSttOptions extends SttHandlers {
  lang: string;
  endpointingMs: number;
  // false면 침묵에도 턴을 끝내지 않는다 — stop() 호출만이 유일한 종료 경로
  stopOnSilence: boolean;
}

const TOKEN_ENDPOINT = '/api/stt/token';
const DEEPGRAM_WS_URL = 'wss://api.deepgram.com/v1/listen';

const pickMimeType = () => {
  if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
  if (MediaRecorder.isTypeSupported('audio/ogg')) return 'audio/ogg';
  return '';
};

interface DeepgramMessage {
  type: string;
  channel?: { alternatives: { transcript: string }[] };
  is_final?: boolean;
  // stop()의 Finalize 요청에 대한 응답 표시
  from_finalize?: boolean;
}

// getUserMedia 거부·미지원, 토큰 실패, WS 연결 실패 시 throw → 호출부(훅)가 폴백을 판단한다
export const startDeepgramStt = async (
  options: DeepgramSttOptions,
): Promise<SttSession> => {
  const { lang, endpointingMs, stopOnSilence, onInterim, onFinal, onError } =
    options;

  // 실시간 오디오 캡처 미지원(구형 iOS WKWebView 등) → throw로 폴백 유도
  if (
    typeof MediaRecorder === 'undefined' ||
    !navigator.mediaDevices?.getUserMedia
  ) {
    throw new Error('이 브라우저는 실시간 오디오 캡처를 지원하지 않습니다.');
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // 앞부분 유실 방지 — getUserMedia 직후 바로 녹음을 시작하고, WS가 열리기 전 오디오는
  // 버퍼에 담아 뒀다가 open 시 먼저 흘려보낸다. (토큰 발급·WS 핸드셰이크 지연 동안 말한
  // 첫 단어가 잘리던 문제 — 네이티브의 사전연결에 대응하는 웹 보정)
  const mimeType = pickMimeType();
  const pendingChunks: Blob[] = [];
  let ws: WebSocket | null = null;

  const recorder = new MediaRecorder(
    stream,
    mimeType ? { mimeType } : undefined,
  );
  recorder.ondataavailable = (event) => {
    if (event.data.size === 0) return;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(event.data);
    else pendingChunks.push(event.data);
  };
  recorder.start(250);

  const stopRecorder = () => {
    if (recorder.state !== 'inactive') recorder.stop();
  };

  const tokenRes = await fetch(TOKEN_ENDPOINT, { method: 'POST' });
  if (!tokenRes.ok) {
    stopRecorder();
    stream.getTracks().forEach((track) => track.stop());
    throw new Error(`토큰 발급 실패: ${tokenRes.status}`);
  }
  const { token } = (await tokenRes.json()) as { token: string };

  const params = new URLSearchParams({
    model: 'nova-3',
    language: lang,
    smart_format: 'true',
    interim_results: 'true',
    // 자동 종료를 끄면 침묵 감지 이벤트 자체를 받지 않는다 — 종료는 stop()만
    ...(stopOnSilence
      ? {
          endpointing: String(endpointingMs),
          utterance_end_ms: String(endpointingMs),
          vad_events: 'true',
        }
      : { endpointing: 'false' }),
  });
  const socket = new WebSocket(`${DEEPGRAM_WS_URL}?${params}`, [
    'bearer',
    token,
  ]);
  ws = socket; // 이 시점부터 recorder.ondataavailable가 live 전송으로 전환된다

  let finalTranscript = '';
  let finished = false;
  let finalizeTimer: ReturnType<typeof setTimeout> | null = null;

  const cleanup = () => {
    if (finalizeTimer) clearTimeout(finalizeTimer);
    finalizeTimer = null;
    stopRecorder();
    stream.getTracks().forEach((track) => track.stop());
    if (socket.readyState === WebSocket.OPEN) socket.close();
  };

  // 턴 종료를 정확히 한 번만 처리
  const finishTurn = () => {
    if (finished) return;
    finished = true;
    cleanup();
    onFinal(finalTranscript.trim());
  };

  socket.onopen = () => {
    // WS 여는 동안 버퍼에 쌓인 앞부분 오디오를 먼저 흘려보낸다
    for (const chunk of pendingChunks) socket.send(chunk);
    pendingChunks.length = 0;
  };

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data as string) as DeepgramMessage;

    if (msg.type === 'Results' && msg.channel) {
      const text = msg.channel.alternatives[0]?.transcript ?? '';
      if (text) {
        if (msg.is_final) {
          finalTranscript = `${finalTranscript} ${text}`.trim();
          onInterim(finalTranscript);
        } else {
          onInterim(`${finalTranscript} ${text}`.trim());
        }
      }
      // stop()의 Finalize 응답 — 남은 버퍼까지 반영된 시점이라 타임아웃 없이 즉시 종료
      if (msg.from_finalize) finishTurn();
      return;
    }

    // 침묵 감지 → 발화 종료
    if (msg.type === 'UtteranceEnd') finishTurn();
  };

  const fail = (message: string) => {
    if (finished) return;
    finished = true;
    cleanup();
    onError(new Error(message));
  };

  // 연결 성립 전 실패는 throw로 잡히므로, 여기 도달하면 세션 도중 에러
  socket.onerror = () => fail('STT 연결 오류');
  socket.onclose = () => fail('STT 연결이 끊겼습니다.');

  return {
    stop: () => {
      if (finished) return;
      // Finalize 전송 → 남은 버퍼 처리 후 UtteranceEnd 수신 → finishTurn.
      // 응답 전 WS가 닫혀 있으면 즉시 종료.
      if (socket.readyState === WebSocket.OPEN) {
        stopRecorder();
        socket.send(JSON.stringify({ type: 'Finalize' }));
        // UtteranceEnd가 안 오는 경우 대비 — 일정 시간 후 강제 종료
        finalizeTimer = setTimeout(finishTurn, 2000);
      } else {
        finishTurn();
      }
    },
  };
};
