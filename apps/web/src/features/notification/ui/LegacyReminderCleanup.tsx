// [한시] 구 셸(로컬 리마인더 시절)에 남은 예약을 지운다 — 루트 레이아웃에 마운트.
// 새 셸은 핸들러가 없어 무시하고 시작 시 스스로 전부 취소하므로, 구 바이너리가 소멸하면 브릿지 메시지와 함께 제거한다
'use client';

import { useEffect } from 'react';

import { postToNative } from '@/shared/bridge/web-bridge';

export const LegacyReminderCleanup = () => {
  useEffect(() => {
    postToNative({ type: 'SYNC_REMINDERS', reminders: [] });
  }, []);

  return null;
};
