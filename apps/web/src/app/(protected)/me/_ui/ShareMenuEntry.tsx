'use client';

// 마이페이지 "친구에게 랜딧 공유하기" 행 — 누르면 설치 링크를 담아 공유 시트를 연다. 못 열면 링크를 복사한다
import { useRef } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { shareText } from '@/shared/lib/share-text';
import { Emoji } from '@/shared/ui/emoji';
import { showToast } from '@/shared/ui/toast';

import { MenuButton } from './Menu';

// 받는 사람 기기에 맞는 스토어로 보내는 /download에 친구 공유 유입 딱지를 붙인다 (docs/analytics-utm.md).
// 도메인은 고정한다 — 개발 서버에서 눌러도 친구에게는 실제 주소가 가야 한다
const SHARE_MESSAGE =
  '랜딧에서 영어 공부 같이 해요 🙌\nhttps://landit.im/download?utm_source=share&utm_medium=referral&utm_campaign=friend_invite';

export const ShareMenuEntry = () => {
  // 웹 공유 시트가 떠 있는 동안 또 누르면 두 번째 공유가 거절돼 복사로 새 버린다 — 끝날 때까지 탭을 무시한다.
  // 셸 공유 시트는 SHARE를 보내자마자 풀리므로 연타는 셸이 막는다(apps/mobile bridge/share.ts)
  const isSharingRef = useRef(false);

  const share = async () => {
    if (isSharingRef.current) return;
    isSharingRef.current = true;
    try {
      const method = await shareText(SHARE_MESSAGE);
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
