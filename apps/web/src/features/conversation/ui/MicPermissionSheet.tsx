// 마이크 권한 거부 안내 바텀시트 — 앱이면 설정 앱을 열도록 유도하고, 브라우저면 안내 문구만 보여준다
'use client';

import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { getSurface } from '@/shared/bridge/native-context';
import { postToNative } from '@/shared/bridge/web-bridge';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

interface MicPermissionSheetProps {
  open: boolean;
  onClose: () => void;
}

// 앱(WebView)에서 설정 앱까지 가는 단계 — 실제 이동은 네이티브가 OPEN_SETTINGS로 처리한다
const APP_STEPS = [
  "아래 '설정 열기'를 눌러요.",
  '권한 → 마이크로 이동해요.',
  '허용을 켜고 돌아와요.',
];

export const MicPermissionSheet = ({
  open,
  onClose,
}: MicPermissionSheetProps) => {
  // 앱이면 설정 앱을 바로 열 수 있지만, 브라우저는 프로그램적으로 못 열어 안내 문구만 보여준다
  const isApp = getSurface() === 'app';

  const openSettings = () => {
    track(EVENTS.MIC_SETTINGS_OPENED);
    postToNative({ type: 'OPEN_SETTINGS' });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="text-[17px] font-bold text-foreground">
        마이크를 켜야 대화할 수 있어요
      </h2>

      {isApp ? (
        <ol className="mt-4 space-y-2.5 rounded-2xl bg-muted px-4 py-4">
          {APP_STEPS.map((text, index) => (
            <li key={text} className="flex items-center gap-3">
              <span className="flex size-5 flex-none items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {index + 1}
              </span>
              <span className="text-sm text-foreground">{text}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          브라우저 설정에서 이 사이트의 마이크 권한을 허용한 뒤 다시 시도해
          주세요.
        </p>
      )}

      <div
        className={`mt-5 grid gap-2 ${isApp ? 'grid-cols-2' : 'grid-cols-1'}`}
      >
        <Button variant="ghost" size="md" onClick={onClose}>
          닫기
        </Button>
        {isApp && (
          <Button size="md" onClick={openSettings}>
            설정 열기
          </Button>
        )}
      </div>
    </BottomSheet>
  );
};
