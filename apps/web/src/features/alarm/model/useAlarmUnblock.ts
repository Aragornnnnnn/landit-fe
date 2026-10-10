'use client';

// 알람을 막는 권한을 푸는 배선 — 무엇이 막혔는지(alarmBlocker)와 풀 동작(unblockAction)은 alarm-permission.ts의 규칙이 정하고,
// 여기서는 셸에 요청을 보내거나 안내 시트를 연다. 회신 상태는 useAlarmStatus가 받아 화면에 반영한다
import { useEffect, useRef, useState } from 'react';
import type { AlarmStatus } from '@landit/bridge';

// Android는 알림이 꺼지면 알람을 못 건다 — 알림 권한을 다시 물을 수 있는지(팝업)와 없는지(앱 설정)를 알림 슬라이스의 권한 상태로 가른다
import { useNotificationPermission } from '@/features/notification/model/useNotificationPermission';
import { requestFromNative } from '@/shared/bridge/request';
import { postToNative } from '@/shared/bridge/web-bridge';

import {
  alarmBlocker,
  setupPermissionStep,
  unblockAction,
} from './alarm-permission';
import { alarmPlatform } from './shell-alarm';

// 사용자가 권한창 앞에서 머뭇거릴 수 있다 — 넉넉히 기다리고, 지나면 그냥 넘어간다
const PERMISSION_TIMEOUT_MS = 2 * 60 * 1000;
// 상태 조회는 바로 돌아온다 — 못 받아도 오래 붙잡지 않는다
const STATUS_TIMEOUT_MS = 3000;

export type AlarmUnblockSheet = 'ios-settings' | 'android-settings';

export const useAlarmUnblock = (status: AlarmStatus | null) => {
  const notificationPermission = useNotificationPermission();
  const [sheet, setSheet] = useState<AlarmUnblockSheet | null>(null);

  const platform = alarmPlatform();
  const blocker = status ? alarmBlocker(status, platform) : null;
  // 누른 뒤 한참 뒤에 부를 수 있다(다짐 3초 + 저장) — 그사이 바뀐 권한 상태를 보게 늘 최신 값을 읽는다
  const latest = useRef({ blocker, notificationPermission });
  useEffect(() => {
    latest.current = { blocker, notificationPermission };
  });

  /** 막힌 것을 풀러 간다 — 팝업을 띄우면 답할 때까지, 시트를 열면 바로 끝난다 */
  const unblock = async () => {
    const now = latest.current;
    if (!now.blocker) return;
    switch (unblockAction(now.blocker, now.notificationPermission)) {
      case 'request-alarm':
        await requestFromNative({
          request: { type: 'REQUEST_ALARM_PERMISSION' },
          replyType: 'ALARM_STATUS',
          timeoutMs: PERMISSION_TIMEOUT_MS,
        });
        return;
      case 'request-notification':
        await requestFromNative({
          request: { type: 'REQUEST_NOTIFICATION_PERMISSION' },
          replyType: 'NOTIFICATION_PERMISSION',
          timeoutMs: PERMISSION_TIMEOUT_MS,
        });
        // 알림 회신만으로는 알람 상태가 아직 옛것이다 — 새 상태까지 받아야 "거의 다 됐어요"가 깜빡이지 않는다
        await requestFromNative({
          request: { type: 'GET_ALARM_STATUS' },
          replyType: 'ALARM_STATUS',
          timeoutMs: STATUS_TIMEOUT_MS,
        });
        return;
      case 'open-app-settings':
        postToNative({ type: 'OPEN_SETTINGS' });
        return;
      case 'ios-settings-sheet':
        setSheet('ios-settings');
        return;
      case 'android-settings-sheet':
        setSheet('android-settings');
        return;
    }
  };

  /** 다짐 직후 권한 단계 — 최신 권한 상태로 정한다 */
  const setupStep = () =>
    setupPermissionStep(
      latest.current.blocker,
      latest.current.notificationPermission,
    );

  return {
    blocker,
    setupStep,
    unblock,
    sheet,
    closeSheet: () => setSheet(null),
  };
};
