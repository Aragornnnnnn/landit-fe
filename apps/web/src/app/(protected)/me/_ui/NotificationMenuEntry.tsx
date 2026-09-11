// 마이페이지 "푸시 알림" 행 — 아직 안 물었으면 동의 시트를, 이미 답했으면(허용·거부) OS 설정을 연다.
// 권한 체계가 없는 환경(브라우저·구버전 셸)에서는 행 자체가 없다
'use client';

import { useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { requestNotificationPermission } from '@/features/notification/model/request-permission';
import { useNotificationPermission } from '@/features/notification/model/useNotificationPermission';
import { NotificationConsentSheet } from '@/features/notification/ui/NotificationConsentSheet';
import { track } from '@/shared/analytics';
import { postToNative } from '@/shared/bridge/web-bridge';
import { Emoji } from '@/shared/ui/emoji';

import { MenuButton } from './Menu';

export const NotificationMenuEntry = () => {
  const notificationPermission = useNotificationPermission();
  const [isPromptOpen, setIsPromptOpen] = useState(false);

  if (notificationPermission === 'unavailable') return null;

  const openNotificationSetup = () => {
    // 이미 답한 유저는 인앱 재요청이 불가능하다 — 끄고 켜는 건 OS 설정에서
    if (notificationPermission !== 'undetermined') {
      postToNative({ type: 'OPEN_SETTINGS' });
      return;
    }
    track(EVENTS.NOTIFICATION_CONSENT_VIEWED, { source: 'me' });
    setIsPromptOpen(true);
  };

  // 수락 = OS 권한창 요청 — 회신은 훅이 받아 상태를 갱신한다
  const accept = () => {
    track(EVENTS.NOTIFICATION_CONSENT_ACCEPTED, { source: 'me' });
    requestNotificationPermission('me');
    setIsPromptOpen(false);
  };

  const dismiss = () => {
    track(EVENTS.NOTIFICATION_CONSENT_DISMISSED, { source: 'me' });
    setIsPromptOpen(false);
  };

  return (
    <>
      <MenuButton
        title="푸시 알림"
        icon={<Emoji>🔔</Emoji>}
        onClick={openNotificationSetup}
      />

      {/* 유저가 직접 연 시트라 닫아도 홈 게이트의 노출 기록에는 영향을 주지 않는다 */}
      {isPromptOpen && (
        <NotificationConsentSheet onAccept={accept} onDismiss={dismiss} />
      )}
    </>
  );
};
