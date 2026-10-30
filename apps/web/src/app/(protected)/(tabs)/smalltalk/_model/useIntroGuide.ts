// 스몰톡 홈의 첫 안내 — 처음 온 기기에 한 번 띄운다. 캐릭터를 누르면 언제든 인사하고, 들어 본 것으로 기기에 남긴다
// (탭 셸의 스몰톡 칩 점이 이 기록을 본다)
'use client';

import { useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';

import { tapGreetingSeen } from '../../_model/tap-greeting-seen';
import { clearOldIntroGuideSeen, introGuideSeen } from './intro-guide-seen';

/**
 * onTap — 캐릭터를 눌렀을 때 할 일(인사 시작)
 * held — 화면 위에 더 급한 것(강제 업데이트·조회 중·주제 고르기)이 있다. 풀릴 때까지 안내를 띄우지 않는다
 */
export const useIntroGuide = ({
  onTap,
  held = false,
}: {
  onTap: () => void;
  held?: boolean;
}) => {
  // 서버 렌더엔 localStorage가 없어 안 본 것으로 두고, 하이드레이션 뒤 첫 상태 계산에서 본 기록이 반영된다
  const [guideUnseen, setGuideUnseen] = useState(() => !introGuideSeen.has());
  const guideOpen = !held && guideUnseen;

  const closeGuide = () => {
    track(EVENTS.SMALL_TALK_INTRO_GUIDE_CLOSED);
    introGuideSeen.mark();
    clearOldIntroGuideSeen();
    setGuideUnseen(false);
  };

  const tapPartner = () => {
    onTap();
    tapGreetingSeen.mark();
  };

  return { guideOpen, closeGuide, tapPartner };
};
