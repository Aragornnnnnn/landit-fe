'use client';

// 마이페이지 "친구에게 랜딧 공유하기" 행 — 누르면 설치 링크를 담아 공유 시트를 연다. 못 열면 링크를 복사한다
import { useRef } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { Emoji } from '@/shared/ui/emoji';
import { showToast } from '@/shared/ui/toast';

import { SHARE_MESSAGE, shareApp } from '../_model/share-app';
import { MenuButton } from './Menu';

export const ShareMenuEntry = () => {
  // 웹 공유 시트가 떠 있는 동안 또 누르면 두 번째 공유가 거절돼 복사로 새 버린다 — 끝날 때까지 탭을 무시한다.
  // 셸 공유 시트는 SHARE를 보내자마자 풀리므로 연타는 셸이 막는다(apps/mobile bridge/share.ts)
  const isSharingRef = useRef(false);

  const share = async () => {
    if (isSharingRef.current) return;
    isSharingRef.current = true;
    try {
      const method = await shareApp(SHARE_MESSAGE);
      track(EVENTS.APP_SHARE_TAPPED, { method });
      if (method === 'copy') showToast('링크를 복사했어요');
    } catch {
      showToast('링크를 복사하지 못했어요');
    } finally {
      isSharingRef.current = false;
    }
  };

  return (
    <MenuButton
      title="친구에게 랜딧 공유하기"
      icon={<Emoji>📤</Emoji>}
      onClick={() => void share()}
    />
  );
};
