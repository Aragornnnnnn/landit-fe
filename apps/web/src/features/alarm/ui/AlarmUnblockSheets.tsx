'use client';

// 막힌 권한을 풀어 주는 안내 시트 — useAlarmUnblock이 고른 시트(iOS 설정 안내·Android 두 가지 켜기)를 그린다.
// 배너와 등록 흐름이 같이 쓴다
import type { AlarmStatus } from '@landit/bridge';

import type { AlarmUnblockSheet } from '../model/useAlarmUnblock';
import { AndroidAlarmSettingsSheet } from './AndroidAlarmSettingsSheet';
import { IosAlarmSettingsSheet } from './IosAlarmSettingsSheet';

export const AlarmUnblockSheets = ({
  sheet,
  status,
  onClose,
}: {
  sheet: AlarmUnblockSheet | null;
  status: AlarmStatus | null;
  onClose: (closed: AlarmUnblockSheet) => void;
}) => (
  <>
    <IosAlarmSettingsSheet
      open={sheet === 'ios-settings'}
      onClose={() => onClose('ios-settings')}
    />
    <AndroidAlarmSettingsSheet
      open={sheet === 'android-settings'}
      status={status}
      onClose={() => onClose('android-settings')}
    />
  </>
);
