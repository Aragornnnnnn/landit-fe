'use client';

// 마이페이지 "진동" 행 — 눌러 들어간 시트에서 버튼 탭 진동을 켜고 끈다. 값은 이 기기의 localStorage에만 산다
import { useState, useSyncExternalStore } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import {
  isHapticsEnabled,
  setHapticsEnabled,
  subscribeHapticsSetting,
} from '@/shared/haptics';
import { Emoji } from '@/shared/ui/emoji';

import { MenuButton, MenuGroup, MenuToggle } from './Menu';
import { SettingSheet } from './SettingSheet';

export const HapticMenuEntry = () => {
  const [open, setOpen] = useState(false);
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
    <>
      <MenuButton
        title="진동"
        icon={<Emoji>📳</Emoji>}
        onClick={() => setOpen(true)}
      />

      <SettingSheet
        open={open}
        onClose={() => setOpen(false)}
        title="진동"
        description="버튼을 누를 때 살짝 울리는 진동이에요"
      >
        {/* 시트 안에서도 같은 행 모양 — 카드 한 줄에 스위치 하나 */}
        <MenuGroup>
          <MenuToggle title="버튼 진동" checked={enabled} onChange={toggle} />
        </MenuGroup>
      </SettingSheet>
    </>
  );
};
