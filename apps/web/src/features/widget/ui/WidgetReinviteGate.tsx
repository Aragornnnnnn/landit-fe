// 위젯 재유도 게이트 — 띄울 차례인지 정하고, 답을 기록한다. 언제 마운트할지는 홈 탭이 정한다
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// 알림 동의 시트와의 겹침 방지를 위한 가로 참조 — 같은 순간에 시트 두 장을 띄우지 않는다
import { isConsentPromptDue } from '@/features/notification/model/consent-prompt';
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
  // 자격부터 본다 — 대부분의 방문은 여기서 끝나, 권한 조회(브릿지 왕복)를 아예 걸지 않는다
  const [eligible] = useState(
    () => supportsWidgetInstall(getNativeContext()) && shouldReinvite(),
  );

  if (!eligible) return null;
  return <ArmedReinviteGate />;
};

// 자격이 확인된 뒤에만 마운트된다 — 알림 동의와의 순서 조정과 시트 흐름을 맡는다
const ArmedReinviteGate = () => {
  const router = useRouter();
  const permission = useNotificationPermission();
  // 권한 회신이 온 순간 한 번만 판정을 고정한다 — 초기값(unavailable)으로 섣불리 띄우지 않고,
  // 동의 시트에 답해 권한이 바뀌어도 이 시트가 뒤늦게 뜨거나 연달아 뜨지 않는다
  const [turn, setTurn] = useState<boolean | null>(null);
  if (turn === null && permission !== 'unavailable') {
    // 알림 동의가 뜰 차례면 이번엔 미룬다 — 차례를 소비하지 않아 다음 대화 뒤에 다시 온다
    setTurn(!isConsentPromptDue(permission));
  }
  const [open, setOpen] = useState(true);

  // 띄우는 순간 차례를 소비한다 — 같은 완료로 또 뜨지 않게
  useEffect(() => {
    if (turn) consumeReinvitePending();
  }, [turn]);

  if (!turn) return null;

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
