// 이 설치의 푸시 상태(현재 계정·OS 권한·셸 토큰)를 서버와 맞춘다 — 루트 레이아웃에 마운트
'use client';

import { useEffect, useState } from 'react';

import { useAuthStore } from '@/shared/auth/auth-store';
import { subscribeFromNative } from '@/shared/bridge/web-bridge';
import { reportWarning } from '@/shared/monitoring/report';

import { syncPushDevice } from '../model/push-device';
import { useNotificationPermission } from '../model/useNotificationPermission';

export const PushDeviceSync = () => {
  const userId = useAuthStore((state) => state.member?.userId);
  // 권한은 실행·포그라운드 복귀마다 다시 조회된다 — OS 설정에서 바꾼 권한도 여기로 들어온다
  const permission = useNotificationPermission();
  // 셸은 권한만 보고 보내므로 로그인 화면에서도 온다 — 받아서 들고 있다가 로그인되면 보낸다
  const [token, setToken] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeFromNative((message) => {
        if (message.type === 'PUSH_TOKEN') setToken(message.token);
      }),
    [],
  );

  // 계정·권한·토큰 중 하나라도 바뀌면 다시 보낸다 — 실행·로그인·계정 전환·권한 변경·토큰 갱신이 모두 여기로 온다
  useEffect(() => {
    if (!userId) return;
    // 동기화 실패로 화면이 깨지면 안 된다 — 다음 실행에서 다시 보낸다
    syncPushDevice(permission, token).catch((error: unknown) => {
      console.warn('[push-device] 동기화 실패:', error);
      reportWarning(error);
    });
  }, [userId, permission, token]);

  return null;
};
