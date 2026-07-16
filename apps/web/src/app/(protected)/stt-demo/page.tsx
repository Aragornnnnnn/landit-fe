'use client';

// STT 훅(useStt) 동작 확인용 데모 페이지
import { useState } from 'react';

import { useStt, type SttStatus } from '@/shared/lib/stt/useStt';
import { Button } from '@/shared/ui/Button';

import { SttDebugPanel } from './_components/SttDebugPanel';

const STATUS_LABEL: Record<SttStatus, string> = {
  idle: '대기',
  connecting: '연결 중',
  listening: '듣는 중',
  error: '오류',
};

export default function SttDemoPage() {
  const [stopOnSilence, setStopOnSilence] = useState(true);
  const {
    transcript,
    interim,
    status,
    error,
    isListening,
    start,
    stop,
    reset,
  } = useStt({
    stopOnSilence,
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">STT 데모</h1>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
          {STATUS_LABEL[status]}
        </span>
      </header>

      <div className="min-h-40 rounded-xl border border-border bg-card p-4">
        {transcript || interim ? (
          <p className="whitespace-pre-wrap text-foreground">
            {transcript}
            {interim && (
              <span className="text-muted-foreground"> {interim}</span>
            )}
          </p>
        ) : (
          <p className="text-muted-foreground">마이크를 켜고 말해보세요.</p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error.message}</p>}

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={stopOnSilence}
          onChange={(e) => setStopOnSilence(e.target.checked)}
          disabled={isListening || status === 'connecting'}
        />
        말을 멈추면 자동 종료 (2초)
      </label>

      <div className="mt-auto flex flex-col gap-3">
        {isListening ? (
          <Button variant="danger" onClick={stop}>
            멈추기
          </Button>
        ) : (
          <Button onClick={() => start()} loading={status === 'connecting'}>
            말하기
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={reset}
          disabled={isListening || status === 'connecting'}
        >
          지우기
        </Button>
      </div>

      <SttDebugPanel />
    </main>
  );
}
