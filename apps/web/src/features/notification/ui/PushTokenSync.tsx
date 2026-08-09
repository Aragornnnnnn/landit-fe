// 셸이 보낸 푸시 토큰을 서버에 등록한다 — 루트 레이아웃에 마운트
'use client';

import { useEffect, useState } from 'react';

import { useAuthStore } from '@/shared/auth/auth-store';
import { subscribeFromNative } from '@/shared/bridge/web-bridge';
import { reportWarning } from '@/shared/monitoring/report';

import { registerPushToken } from '../model/push-token-registration';

export const PushTokenSync = () => {
  const userId = useAuthStore((state) => state.member?.userId);
  // 셸은 권한만 보고 보내므로 로그인 화면에서도 온다 — 받아서 들고 있다가 로그인되면 등록한다
  const [token, setToken] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeFromNative((message) => {
        if (message.type === 'PUSH_TOKEN') setToken(message.token);
      }),
    [],
  );

  // 토큰과 로그인이 둘 다 갖춰지는 순간 등록한다 — 어느 쪽이 먼저 와도 되고, 계정이 바뀌면 다시 등록된다
  useEffect(() => {
    if (!token || !userId) return;
    // 등록 실패로 화면이 깨지면 안 된다 — 다음 실행에서 셸이 토큰을 다시 보낸다
    registerPushToken(token).catch((error: unknown) => {
      console.warn('[push-token] 등록 실패:', error);
      reportWarning(error);
    });
  }, [token, userId]);

  return null;
};
