// 권한이 허용된 순간 로컬 알림 예약 목록을 셸로 동기화한다 — 루트 레이아웃에 마운트
'use client';

import { useEffect } from 'react';

import { postToNative } from '@/shared/bridge/web-bridge';

import { buildReminders } from '../model/reminders';
import { useNotificationPermission } from '../model/useNotificationPermission';

export const ReminderSync = () => {
  const permission = useNotificationPermission();

  // granted로 바뀌는 두 경로를 이 effect 하나가 다 받는다 — ①부팅 시 이미 허용 ②방금 동의해 허용
  useEffect(() => {
    if (permission !== 'granted') return;
    postToNative({
      type: 'SYNC_REMINDERS',
      reminders: buildReminders(new Date()),
    });
  }, [permission]);

  return null;
};
