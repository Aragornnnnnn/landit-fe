// 기존 유저 알림 동의 게이트 — 홈에서 아직 알림을 안 켠(미결정) 유저에게 첫 1회는 풀스크린, 이후 실행마다 바텀시트를 띄운다
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

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
  if (pathname !== '/home') return null;
  if (dismissed || notificationPermission !== 'undetermined') return null;

  // 수락/거절 무관하게 풀스크린 소진을 기록한다 — 다음부터는 바텀시트가 맡는다
  const close = () => {
    markConsentPromptSeen();
    setDismissed(true);
  };

  // 수락 시 실제 권한 요청(REQUEST_NOTIFICATION_PERMISSION)은 브릿지 확장 후 배선한다
  return promptSeen ? (
    <NotificationConsentSheet onAccept={close} onDismiss={close} />
  ) : (
    <NotificationConsentPrompt onAccept={close} onDismiss={close} />
  );
};
