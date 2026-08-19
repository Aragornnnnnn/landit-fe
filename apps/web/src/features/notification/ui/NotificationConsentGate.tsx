// 기존 유저 알림 동의 게이트 — 아직 알림을 안 켠 유저에게 딱 한 번 청한다.
// 언제 청할지(오늘 카드에 대한 판단이 끝난 뒤)는 이 컴포넌트를 띄우는 쪽이 정한다
'use client';

import { useEffect, useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';

import {
  hasSeenConsentPrompt,
  markConsentPromptSeen,
} from '../model/consent-prompt';
import { requestNotificationPermission } from '../model/request-permission';
import { useNotificationPermission } from '../model/useNotificationPermission';
import { NotificationConsentSheet } from './NotificationConsentSheet';

export const NotificationConsentGate = () => {
  const notificationPermission = useNotificationPermission();
  // 지난 실행에서 청한 기록과 이번 실행의 응답을 한 값으로 본다 — 어느 쪽이든 다시 묻지 않는다.
  // 서버에선 localStorage가 없어 false로 초기화되지만, 권한도 첫 렌더엔 unavailable이라 하이드레이션이 어긋나지 않는다
  const [asked, setAsked] = useState(hasSeenConsentPrompt);

  // denied는 인앱 재요청이 불가능해 물어도 소용없고, granted는 물을 이유가 없고, unavailable은 요청 수단이 없는 환경
  const visible = !asked && notificationPermission === 'undetermined';

  useEffect(() => {
    if (visible)
      track(EVENTS.NOTIFICATION_CONSENT_VIEWED, { source: 'scenario' });
  }, [visible]);

  if (!visible) return null;

  // 수락/거절 무관하게 청한 것으로 남긴다 — 못 켠 사람의 통로는 마이페이지 "알림 켜기"다
  const close = () => {
    markConsentPromptSeen();
    setAsked(true);
  };

  const dismiss = () => {
    track(EVENTS.NOTIFICATION_CONSENT_DISMISSED, { source: 'scenario' });
    close();
  };

  // 수락 = OS 권한창 요청 — 회신은 훅이 받아 상태를 갱신하고, 허용되면 ReminderSync가 예약까지 이어간다
  const accept = () => {
    track(EVENTS.NOTIFICATION_CONSENT_ACCEPTED, { source: 'scenario' });
    requestNotificationPermission('scenario');
    close();
  };

  return <NotificationConsentSheet onAccept={accept} onDismiss={dismiss} />;
};
