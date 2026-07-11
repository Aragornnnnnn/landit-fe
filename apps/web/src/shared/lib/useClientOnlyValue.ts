'use client';

// SSR·하이드레이션 첫 렌더에선 serverValue, 그 뒤 클라이언트에서 getClientValue() — 서버 HTML과 첫 렌더를 일치시킨다
import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

export function useClientOnlyValue<T>(
  getClientValue: () => T,
  serverValue: T,
): T {
  return useSyncExternalStore(
    emptySubscribe,
    getClientValue,
    () => serverValue,
  );
}
