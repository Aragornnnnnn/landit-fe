// 위젯 재유도 게이트 — 띄울 차례인지 정하고, 답을 기록한다. 언제 마운트할지는 홈 탭이 정한다
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// 알림 동의 시트와의 겹침 방지를 위한 가로 참조 — 같은 순간에 시트 두 장을 띄우지 않는다
import { hasSeenConsentPrompt } from '@/features/notification/model/consent-prompt';
import { useNotificationPermission } from '@/features/notification/model/useNotificationPermission';
import { getNativeContext } from '@/shared/bridge/native-context';
import { postToNative } from '@/shared/bridge/web-bridge';
import { WIDGET_INSTALL_PATH } from '@/shared/lib/routes';

import {
  consumeReinvitePending,
  recordReinviteAnswer,
  shouldReinvite,
  supportsWidgetInstall,
} from '../model/install-prompt';
import { WidgetReinviteSheet } from './WidgetReinviteSheet';

export const WidgetReinviteGate = () => {
  const router = useRouter();
  const permission = useNotificationPermission();
  // 마운트 때 한 번 판단해 고정한다 — 차례가 소비돼도 시트가 사라지지 않게
  const [eligible] = useState(
    () => supportsWidgetInstall(getNativeContext()) && shouldReinvite(),
  );
  const [open, setOpen] = useState(true);

  // 알림 동의가 뜰 차례면 이번엔 미룬다 — 차례를 소비하지 않아 다음 대화 뒤에 다시 온다
  const consentTurn = !hasSeenConsentPrompt() && permission === 'undetermined';
  const visible = eligible && !consentTurn;

  // 띄우는 순간 차례를 소비한다 — 같은 완료로 또 뜨지 않게
  useEffect(() => {
    if (visible) consumeReinvitePending();
  }, [visible]);

  if (!visible) return null;

  // 설치로 답했다 — 안드로이드는 시스템 다이얼로그, iOS는 갤러리 여는 길 안내로
  const install = () => {
    recordReinviteAnswer('install');
    if (getNativeContext()?.platform === 'android') {
      postToNative({ type: 'REQUEST_WIDGET_PIN' });
      setOpen(false);
      return;
    }
    router.push(`${WIDGET_INSTALL_PATH}?start=guide`);
  };

  // 거절도 답이다 — 이후 다시 묻지 않는다
  const dismiss = () => {
    recordReinviteAnswer('dismiss');
    setOpen(false);
  };

  return (
    <WidgetReinviteSheet open={open} onInstall={install} onDismiss={dismiss} />
  );
};
