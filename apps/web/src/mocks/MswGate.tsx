'use client';

// MSW 게이트 — 개발 환경에서 NEXT_PUBLIC_API_MOCKING=enabled면 워커가 준비된 뒤에 앱을 렌더한다
// (워커가 뜨기 전에 fetch가 나가면 실서버로 새므로, 준비 완료까지 자식 렌더를 막는다)
import { useEffect, useState } from 'react';

const mockingEnabled = process.env.NEXT_PUBLIC_API_MOCKING === 'enabled';

export const MswGate = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(!mockingEnabled);

  useEffect(() => {
    if (!mockingEnabled) return;
    let active = true;
    void import('./browser').then(async ({ worker }) => {
      await worker.start({ onUnhandledRequest: 'bypass' });
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!ready) return null;
  return children;
};
