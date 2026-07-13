'use client';

// STT 디버그 패널 (개발 전용) — 에뮬레이터/실기기 화면에서 마이크 입력 레벨과 Deepgram WS 파이프라인을 직접 확인한다
import { useEffect, useRef, useState } from 'react';

const isDev = process.env.NODE_ENV === 'development';

export const SttDebugPanel = () => {
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(0);
  const [micState, setMicState] = useState('아직 측정 안 함');
  const [logs, setLogs] = useState<string[]>([]);
  const rafRef = useRef<number | null>(null);

  // Deepgram WS 도청 — 연결/전송/응답을 화면 로그로. window.WebSocket을 한 번만 교체한다
  useEffect(() => {
    if (!isDev) return;
    const w = window as unknown as { __sttWsPatched?: boolean };
    if (w.__sttWsPatched) return;
    w.__sttWsPatched = true;

    const push = (line: string) =>
      setLogs((prev) => [line, ...prev].slice(0, 25));
    const Orig = window.WebSocket;
    const Patched = function (url: string, protocols?: string | string[]) {
      const ws = new Orig(url, protocols);
      if (String(url).includes('deepgram')) {
        let bytes = 0;
        push('WS 연결 시도');
        ws.addEventListener('open', () => push('WS open ✅'));
        ws.addEventListener('close', (e) => push(`WS close code=${e.code}`));
        ws.addEventListener('error', () => push('WS error ❌'));
        ws.addEventListener('message', (e) => {
          try {
            const m = JSON.parse(e.data as string);
            if (m.type === 'Results')
              push(
                `📩 Results "${m.channel?.alternatives?.[0]?.transcript ?? ''}"`,
              );
            else push(`📩 ${m.type}`);
          } catch {
            /* noop */
          }
        });
        const origSend = ws.send.bind(ws);
        ws.send = (d: string | ArrayBufferLike | Blob | ArrayBufferView) => {
          if (typeof d === 'string') push(`📤 ${d}`);
          else {
            const size = (d as Blob).size ?? (d as ArrayBuffer).byteLength ?? 0;
            bytes += size;
            if (bytes % 5 < size)
              push(`📤 오디오 ${(bytes / 1024).toFixed(0)}KB 누적`);
          }
          origSend(d as never);
        };
      }
      return ws;
    } as unknown as typeof WebSocket;
    Object.assign(Patched, Orig);
    window.WebSocket = Patched;
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const testMic = async () => {
    setMicState('요청 중...');
    setPeak(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const track = stream.getAudioTracks()[0];
      setMicState(`ON — 장치: ${track.label || '(라벨 없음)'}`);

      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const startedAt = performance.now();

      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += (v - 128) ** 2;
        const rms = Math.sqrt(sum / data.length);
        setLevel(rms);
        setPeak((p) => Math.max(p, rms));
        if (performance.now() - startedAt < 6000) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          stream.getTracks().forEach((t) => t.stop());
          void ctx.close();
          setLevel(0);
          setMicState((s) => `${s} — 측정 종료`);
        }
      };
      tick();
    } catch (e) {
      const err = e as Error;
      setMicState(`실패: ${err.name} — ${err.message}`);
    }
  };

  if (!isDev) return null;

  return (
    <section className="rounded-xl border border-dashed border-border p-3 text-xs">
      <p className="mb-2 font-semibold text-muted-foreground">
        🔧 디버그 (개발 전용)
      </p>

      <button
        type="button"
        onClick={testMic}
        className="mb-2 rounded bg-secondary px-3 py-1 font-medium"
      >
        🎤 마이크 6초 레벨 측정
      </button>
      <p className="mb-1 break-all text-muted-foreground">{micState}</p>
      <div className="my-1 h-3 w-full overflow-hidden rounded bg-muted">
        <div
          className="h-full bg-primary"
          style={{ width: `${Math.min(100, level * 4)}%` }}
        />
      </div>
      <p className="mb-3 text-muted-foreground">
        peak {peak.toFixed(1)}{' '}
        {peak < 2
          ? '→ 무음에 가까움 ⚠️ (에뮬 마이크 확인)'
          : '→ 입력 감지됨 ✅'}
      </p>

      <p className="mb-1 font-medium text-muted-foreground">
        WS 로그 (말하기 누른 뒤)
      </p>
      <div className="max-h-44 space-y-0.5 overflow-y-auto font-mono">
        {logs.length === 0 ? (
          <p className="text-muted-foreground">아직 없음</p>
        ) : (
          logs.map((l, i) => (
            <div key={i} className="break-all text-muted-foreground">
              {l}
            </div>
          ))
        )}
      </div>
    </section>
  );
};
