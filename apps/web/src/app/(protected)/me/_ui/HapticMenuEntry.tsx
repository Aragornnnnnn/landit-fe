'use client';

// 마이페이지 "진동" 토글 — 버튼 탭 진동을 기기에서 끄고 켠다. 값은 이 기기의 localStorage에만 산다
import { useSyncExternalStore } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import {
  isHapticsEnabled,
  setHapticsEnabled,
  subscribeHapticsSetting,
} from '@/shared/haptics';
import { VibrateIcon } from '@/shared/ui/Icons';

import { MenuToggle } from './Menu';

export const HapticMenuEntry = () => {
  // 서버 렌더에서는 켬으로 두고, 클라이언트에서 저장값을 읽는다
  const enabled = useSyncExternalStore(
    subscribeHapticsSetting,
    isHapticsEnabled,
    () => true,
  );

  const toggle = (next: boolean) => {
    setHapticsEnabled(next);
    track(EVENTS.HAPTICS_TOGGLED, { enabled: next });
  };

  return (
    <MenuToggle
      title="진동"
      icon={<VibrateIcon size={22} />}
      checked={enabled}
      onChange={toggle}
    />
  );
};
