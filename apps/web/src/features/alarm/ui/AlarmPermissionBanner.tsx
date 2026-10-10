'use client';

// 등록한 알람이 권한 때문에 안 울릴 때 띄우는 한 줄 — 「지금 켜기」로 꺼진 권한만 다시 켜게 한다
import type { AlarmStatus } from '@landit/bridge';

import { useAlarmUnblock } from '../model/useAlarmUnblock';
import { AlarmUnblockSheets } from './AlarmUnblockSheets';

export const AlarmPermissionBanner = ({
  status,
}: {
  status: AlarmStatus | null;
}) => {
  const { blocker, unblock, sheet, closeSheet } = useAlarmUnblock(status);

  return (
    <>
      {blocker && (
        <div className="flex items-center gap-3 rounded-[14px] bg-destructive/10 py-3 pr-3 pl-4">
          <p className="min-w-0 flex-1 truncate text-[14px] font-bold text-destructive">
            알람을 계속 쓰려면 권한이 필요해요
          </p>
          <button
            type="button"
            onClick={() => void unblock()}
            className="shrink-0 rounded-full bg-destructive px-3 py-1.5 text-[14px] font-bold text-white active:scale-95"
          >
            지금 켜기
          </button>
        </div>
      )}
      <AlarmUnblockSheets sheet={sheet} status={status} onClose={closeSheet} />
    </>
  );
};
