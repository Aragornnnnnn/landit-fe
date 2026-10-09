'use client';

// Android 알람 설정 안내 — 정확한 알람·전체 화면 알림은 팝업이 없어 설정 화면에서 직접 켠다.
// 꺼진 것부터 차례로 하나씩 열고, 돌아오면 useAlarmStatus가 다시 물어 단계가 넘어간다
import type { AlarmStatus } from '@landit/bridge';

import { postToNative } from '@/shared/bridge/web-bridge';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

const STEPS = [
  {
    target: 'exactAlarm',
    title: '정확한 시간에 울리기',
    action: '알람 및 리마인더 켜기',
  },
  {
    target: 'fullScreen',
    title: '잠금화면에 크게 띄우기',
    action: '전체 화면 알림 켜기',
  },
] as const;

export const AndroidAlarmSettingsSheet = ({
  open,
  status,
  onClose,
}: {
  open: boolean;
  status: AlarmStatus | null;
  onClose: () => void;
}) => {
  const current = STEPS.find((step) => status && !status[step.target]);

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="text-[22px] font-bold text-foreground">
        두 가지만 켜 주세요
      </h2>

      <ol className="mt-5 space-y-3">
        {STEPS.map((step, index) => {
          const on = status?.[step.target] === true;
          const active = step === current;
          return (
            <li
              key={step.target}
              className={`flex items-center gap-3 ${active ? '' : 'opacity-40'}`}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </span>
              <span className="flex-1 text-[16px] font-bold text-foreground">
                {step.title}
              </span>
              <span
                aria-label={on ? '켜짐' : '꺼짐'}
                className={`relative h-[26px] w-[44px] shrink-0 rounded-full ${on ? 'bg-primary' : 'bg-[#D1D1D6]'}`}
              >
                <span
                  className="absolute top-[3px] size-5 rounded-full bg-white shadow"
                  style={{ left: on ? 21 : 3 }}
                />
              </span>
            </li>
          );
        })}
      </ol>

      <Button
        className="mt-6"
        onClick={() =>
          current
            ? postToNative({
                type: 'OPEN_ALARM_SETTINGS',
                target: current.target,
              })
            : onClose()
        }
      >
        {current ? current.action : '다 켰어요'}
      </Button>
    </BottomSheet>
  );
};
