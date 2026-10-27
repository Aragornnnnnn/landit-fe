// 마이크 권한 거부 안내 바텀시트 — 앱이면 설정 앱을 열도록 유도하고, 브라우저면 안내 문구만 보여준다
'use client';

import { EVENTS } from '@landit/analytics';
import { useTranslations } from 'next-intl';

import { track } from '@/shared/analytics';
import { getSurface } from '@/shared/bridge/native-context';
import { postToNative } from '@/shared/bridge/web-bridge';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

interface MicPermissionSheetProps {
  open: boolean;
  onClose: () => void;
}

// 앱(WebView)에서 설정 앱까지 가는 단계의 문구 키 — 실제 이동은 네이티브가 OPEN_SETTINGS로 처리한다
const APP_STEPS = ['openSettingsBody', 'findMicBody', 'allowBody'] as const;

export const MicPermissionSheet = ({
  open,
  onClose,
}: MicPermissionSheetProps) => {
  const t = useTranslations('conversation.micPermissionSheet');
  // 앱이면 설정 앱을 바로 열 수 있지만, 브라우저는 프로그램적으로 못 열어 안내 문구만 보여준다
  const isApp = getSurface() === 'app';

  const openSettings = () => {
    track(EVENTS.MIC_SETTINGS_OPENED);
    postToNative({ type: 'OPEN_SETTINGS' });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <BottomSheet.Title className="text-17 font-bold text-foreground">
        {t('title')}
      </BottomSheet.Title>

      {isApp ? (
        <ol className="mt-4 space-y-2.5 rounded-2xl bg-muted px-4 py-4">
          {APP_STEPS.map((step, index) => (
            <li key={step} className="flex items-center gap-3">
              <span className="flex size-5 flex-none items-center justify-center rounded-full bg-primary text-11 font-bold text-primary-foreground">
                {index + 1}
              </span>
              <span className="text-sm text-foreground">{t(step)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('browserBody')}
        </p>
      )}

      <div
        className={`mt-5 grid gap-2 ${isApp ? 'grid-cols-2' : 'grid-cols-1'}`}
      >
        <Button variant="ghost" size="md" onClick={onClose}>
          {t('closeButton')}
        </Button>
        {isApp && (
          <Button size="md" onClick={openSettings}>
            {t('settingsButton')}
          </Button>
        )}
      </div>
    </BottomSheet>
  );
};
