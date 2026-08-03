// 내 정보의 "알림 켜기" 진입점 — 알림을 아직 안 켠 유저에게만 보인다
'use client';

import { useState } from 'react';

import { useNotificationPermission } from '@/features/notification/model/useNotificationPermission';
import { NotificationConsentSheet } from '@/features/notification/ui/NotificationConsentSheet';
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
    setIsPromptOpen(true);
  };

  return (
    <>
      <MenuGroup>
        <MenuButton title="알림 켜기" onClick={openNotificationSetup} />
      </MenuGroup>

      {isPromptOpen && (
        <NotificationConsentSheet
          // 유저가 직접 연 시트라 닫아도 홈 게이트의 재노출 간격에는 영향을 주지 않는다.
          // 수락 시 실제 권한 요청(REQUEST_NOTIFICATION_PERMISSION)은 브릿지 확장 후 배선한다
          onAccept={() => setIsPromptOpen(false)}
          onDismiss={() => setIsPromptOpen(false)}
        />
      )}
    </>
  );
};
