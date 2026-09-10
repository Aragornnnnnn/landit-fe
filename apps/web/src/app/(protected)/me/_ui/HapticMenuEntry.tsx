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
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { VibrateIcon } from '@/shared/ui/Icons';

import { MenuButton, MenuGroup, MenuToggle } from './Menu';

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
        icon={<VibrateIcon size={22} />}
        onClick={() => setOpen(true)}
      />

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <h2 className="text-[17px] font-bold" style={{ color: '#111' }}>
          진동
        </h2>
        <p
          className="mt-1 mb-4 text-[14px] leading-6"
          style={{ color: '#666' }}
        >
          버튼을 누를 때 살짝 울리는 진동이에요
        </p>
        {/* 시트 안에서도 같은 행 모양 — 카드 한 줄에 스위치 하나 */}
        <MenuGroup>
          <MenuToggle title="버튼 진동" checked={enabled} onChange={toggle} />
        </MenuGroup>
        <div className="mt-5">
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            닫기
          </Button>
        </div>
      </BottomSheet>
    </>
  );
};
