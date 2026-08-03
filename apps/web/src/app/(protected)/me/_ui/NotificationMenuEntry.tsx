// 내 정보의 "알림 켜기" 진입점 — 알림을 아직 안 켠 유저에게만 보인다
'use client';

import { useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { useNotificationPermission } from '@/features/notification/model/useNotificationPermission';
import { NotificationConsentSheet } from '@/features/notification/ui/NotificationConsentSheet';
import { track } from '@/shared/analytics';
import { postToNative } from '@/shared/bridge/web-bridge';

import { MenuButton, MenuGroup } from './Menu';

export const NotificationMenuEntry = () => {
  const notificationPermission = useNotificationPermission();
  const [isPromptOpen, setIsPromptOpen] = useState(false);

  // granted는 켤 게 없고, unavailable(브라우저·구버전 셸)은 켤 수단이 없다
  if (
    notificationPermission !== 'undetermined' &&
    notificationPermission !== 'denied'
  )
    return null;

  const openNotificationSetup = () => {
    // 이미 거부한 유저는 인앱 재요청이 불가능하다 — OS 설정으로 보낸다
    if (notificationPermission === 'denied') {
      postToNative({ type: 'OPEN_SETTINGS' });
      return;
    }
    track(EVENTS.NOTIFICATION_CONSENT_VIEWED, { source: 'me' });
    setIsPromptOpen(true);
  };

  // 수락 = OS 권한창 요청 — 회신은 훅이 받아 상태를 갱신하고, 허용되면 행이 사라지고 예약까지 이어진다
  const accept = () => {
    track(EVENTS.NOTIFICATION_CONSENT_ACCEPTED, { source: 'me' });
    postToNative({ type: 'REQUEST_NOTIFICATION_PERMISSION' });
    setIsPromptOpen(false);
  };

  const dismiss = () => {
    track(EVENTS.NOTIFICATION_CONSENT_DISMISSED, { source: 'me' });
    setIsPromptOpen(false);
  };

  return (
    <>
      <MenuGroup>
        <MenuButton title="알림 켜기" onClick={openNotificationSetup} />
      </MenuGroup>

      {/* 유저가 직접 연 시트라 닫아도 홈 게이트의 노출 기록에는 영향을 주지 않는다 */}
      {isPromptOpen && (
        <NotificationConsentSheet onAccept={accept} onDismiss={dismiss} />
      )}
    </>
  );
};
