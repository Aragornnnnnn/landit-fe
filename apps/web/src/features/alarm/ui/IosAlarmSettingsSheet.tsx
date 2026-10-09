'use client';

// iOS 알람 설정 안내 — 한 번 거절하면 팝업을 다시 못 띄운다. 설정 앱의 랜딧 페이지에서 무엇을 켜면 되는지 먼저 보여 주고 보낸다
import { postToNative } from '@/shared/bridge/web-bridge';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

// 설정 앱의 랜딧 페이지에 뜨는 AlarmKit 토글 이름 (기기에서 실제 이름 확인 필요)
const SETTING_NAME = '알람 및 타이머';

const Step = ({ number, children }: { number: number; children: string }) => (
  <li className="flex items-center gap-2.5">
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[13px] font-bold text-primary">
      {number}
    </span>
    <span className="text-[15px] font-medium text-foreground">{children}</span>
  </li>
);

export const IosAlarmSettingsSheet = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const openSettings = () => {
    // iOS 셸은 대상과 상관없이 설정 앱의 랜딧 페이지를 연다
    postToNative({ type: 'OPEN_ALARM_SETTINGS', target: 'exactAlarm' });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="text-[20px] font-bold text-foreground">
        설정에서 이것 하나만 켜 주세요
      </h2>

      <ol className="mt-4 space-y-2.5">
        <Step number={1}>아래 「설정 열기」를 눌러요</Step>
        <Step number={2}>{`'${SETTING_NAME}'를 켜요`}</Step>
      </ol>

      {/* 설정 앱에서 보게 될 모습 */}
      <div aria-hidden className="mt-4 rounded-2xl bg-[#F2F2F7] px-4 py-3">
        <p className="text-[13px] text-muted-foreground">랜딧</p>
        <div className="mt-2 flex items-center rounded-[10px] bg-white px-3.5 py-2.5">
          <span className="flex-1 text-[16px] text-foreground">
            {SETTING_NAME}
          </span>
          <span className="relative h-[31px] w-[51px] rounded-full bg-[#34C759]">
            <span className="absolute top-[2px] right-[2px] size-[27px] rounded-full bg-white shadow" />
          </span>
        </div>
      </div>

      <Button className="mt-6" onClick={openSettings}>
        설정 열기
      </Button>
    </BottomSheet>
  );
};
