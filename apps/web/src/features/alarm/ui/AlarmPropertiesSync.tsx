'use client';

// 알람을 켜 뒀는지를 앰플리튜드 유저 속성으로 올리는 무렌더 컴포넌트 — 루트 레이아웃에 마운트 (SubscriptionPropertiesSync와 같은 배선)
import { useEffect } from 'react';

import { setUserProperties } from '@/shared/analytics';
import { useCurrentUserId } from '@/shared/auth/current-member';

import { useAlarmSettingQuery } from '../model/useAlarmSettingQuery';

/**
 * 서버에 저장된 알람 설정을 프로필에 올린다 — 폰의 권한 상태가 아니라 "등록해 둔 사람인가"다.
 *
 * 설정을 받은 뒤에만 올린다. 알람을 모르는 환경(브라우저·구 셸)은 설정을 묻지 않아 속성도 없다
 */
export const AlarmPropertiesSync = () => {
  const userId = useCurrentUserId();
  const { data: setting } = useAlarmSettingQuery();
  const enabled = setting?.enabled;

  useEffect(() => {
    if (userId === null || enabled === undefined) return;
    setUserProperties({ has_alarm: enabled });
  }, [userId, enabled]);

  return null;
};
