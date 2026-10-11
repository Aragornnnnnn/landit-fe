'use client';

// 마이페이지 "알람" 행 — 등록한 시각, 등록 전이면 "없음", 권한이 꺼져 안 울리면 빨간 "권한 필요"를 오른쪽에 보여 준다.
// 결제 유저 전용이고, 알람을 못 쓰는 환경(브라우저·구 셸·iOS 25 이하)에서는 행 자체가 없다
import { useEffect } from 'react';

import { canUseAlarm } from '@/features/alarm/model/alarm-access';
import { alarmBlocker } from '@/features/alarm/model/alarm-permission';
import { alarmSummary } from '@/features/alarm/model/alarm-summary';
import { alarmPlatform } from '@/features/alarm/model/shell-alarm';
import { useAlarmSettingQuery } from '@/features/alarm/model/useAlarmSettingQuery';
import { useAlarmStatus } from '@/features/alarm/model/useAlarmStatus';
import { preloadIntroPreview } from '@/features/alarm/ui/LockScreenPreview';
import { useSubscriptionQuery } from '@/features/subscription/model/my-subscription/useSubscriptionQuery';
import { useAuthStore } from '@/shared/auth/auth-store';
import { ALARM_SETTINGS_PATH } from '@/shared/lib/routes';
import { Emoji } from '@/shared/ui/emoji';

import { MenuLink } from './Menu';

export const AlarmMenuEntry = () => {
  const status = useAlarmStatus();
  const { data: setting, isPending, isError } = useAlarmSettingQuery();
  const { subscription } = useSubscriptionQuery();
  const isAdmin = useAuthStore((state) => state.member?.role === 'ADMIN');
  const shown =
    status?.supported === true && canUseAlarm({ subscription, isAdmin });
  const needsSetup = !isPending && !isError && setting?.enabled !== true;

  // 등록 전이면 누르는 순간 알람 소개가 뜬다 — 폰 그림을 미리 받아 둔다
  useEffect(() => {
    if (shown && needsSetup) preloadIntroPreview();
  }, [shown, needsSetup]);

  if (!shown) return null;

  const platform = alarmPlatform();
  // 설정을 아직 모르거나 못 읽었으면 "없음"이라고 틀리게 말하지 않고 값을 비워 둔다
  const value =
    isPending || isError
      ? null
      : alarmSummary({
          registered: setting?.enabled === true,
          blocked: alarmBlocker(status, platform) !== null,
          time: setting?.time ?? null,
        });

  return (
    <MenuLink
      href={ALARM_SETTINGS_PATH}
      icon={<Emoji>⏰</Emoji>}
      title="알람"
      value={
        value && (
          <span
            className={`text-[13px] ${value.alert ? 'font-bold text-destructive' : 'text-muted-foreground'}`}
          >
            {value.text}
          </span>
        )
      }
    />
  );
};
