// 기존 유저 알림 동의 게이트 — 홈에서 아직 알림을 안 켠(미결정) 유저에게 첫 1회는 풀스크린, 이후 실행마다 바텀시트를 띄운다
'use client';

import { useEffect, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { usePathname } from 'next/navigation';

import { track } from '@/shared/analytics';
import { postToNative } from '@/shared/bridge/web-bridge';
import { SCENARIO_PATH } from '@/shared/lib/routes';

import {
  hasSeenConsentPrompt,
  markConsentPromptSeen,
} from '../model/consent-prompt';
import { useNotificationPermission } from '../model/useNotificationPermission';
import { NotificationConsentPrompt } from './NotificationConsentPrompt';
import { NotificationConsentSheet } from './NotificationConsentSheet';

export const NotificationConsentGate = () => {
  const pathname = usePathname();
  const notificationPermission = useNotificationPermission();
  // 서버에선 localStorage가 없어 false로 초기화되지만, 권한 상태도 첫 렌더엔 unavailable이라 하이드레이션이 어긋나지 않는다
  const [promptSeen] = useState(hasSeenConsentPrompt);
  // 이번 실행에서 이미 응답했으면 숨긴다 — OS 팝업에 답해 권한이 확정되는 순간 조건이 깨져 영구히 사라진다
  const [dismissed, setDismissed] = useState(false);

  // 온보딩·대화 중에 끼어들지 않게 홈에서만 띄운다.
  // denied는 인앱 재요청이 불가능해 물어도 소용없고, granted는 물을 이유가 없고, unavailable은 요청 수단이 없는 환경
  const visible =
    pathname === SCENARIO_PATH &&
    !dismissed &&
    notificationPermission === 'undetermined';
  const source = promptSeen ? 'home_sheet' : 'home_fullscreen';

  useEffect(() => {
    if (visible) track(EVENTS.NOTIFICATION_CONSENT_VIEWED, { source });
  }, [visible, source]);

  if (!visible) return null;

  // 수락/거절 무관하게 풀스크린 소진을 기록한다 — 다음부터는 바텀시트가 맡는다
  const close = () => {
    markConsentPromptSeen();
    setDismissed(true);
  };

  const dismiss = () => {
    track(EVENTS.NOTIFICATION_CONSENT_DISMISSED, { source });
    close();
  };

  // 수락 = OS 권한창 요청 — 회신은 훅이 받아 상태를 갱신하고, 허용되면 ReminderSync가 예약까지 이어간다
  const accept = () => {
    track(EVENTS.NOTIFICATION_CONSENT_ACCEPTED, { source });
    postToNative({ type: 'REQUEST_NOTIFICATION_PERMISSION' });
    close();
  };

  return promptSeen ? (
    <NotificationConsentSheet onAccept={accept} onDismiss={dismiss} />
  ) : (
    <NotificationConsentPrompt onAccept={accept} onDismiss={dismiss} />
  );
};
