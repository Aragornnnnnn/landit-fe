// 스몰톡 홈의 한 번짜리 안내 둘 — 래디의 첫 안내와, 캐릭터를 눌러 보라는 딤 코치마크.
// 안내를 닫아야 코치마크가 켜지고, 캐릭터를 눌러 인사를 들으면 코치마크는 끝나며 기기에 기억한다.
// 켜져 있는 동안 화면에서 눌리는 건 캐릭터 하나다 — 포인터는 딤이 막고, 키보드는 여기서 캐릭터에 가둔다
'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

import { introGuideSeen } from './intro-guide-seen';
import { tapGreetingSeen } from './tap-greeting-seen';

/** onTap — 캐릭터를 눌렀을 때 할 일(인사 시작). 코치마크 여부와 상관없이 늘 부른다 */
export const useGreetingCoach = ({ onTap }: { onTap: () => void }) => {
  // 서버 렌더엔 localStorage가 없어 안 본 것으로 두고, 하이드레이션 뒤 첫 상태 계산에서 본 기록이 반영된다
  const [guideOpen, setGuideOpen] = useState(() => !introGuideSeen.has());
  const [coachOpen, setCoachOpen] = useState(() => !tapGreetingSeen.has());
  const coaching = !guideOpen && coachOpen;

  // 코치마크가 켜지면 캐릭터로 포커스를 옮긴다 — 키보드 사용자도 어디를 눌러야 하는지 바로 안다
  const partnerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (coaching) partnerRef.current?.focus();
  }, [coaching]);

  const closeGuide = () => {
    introGuideSeen.mark();
    setGuideOpen(false);
  };

  // 코치마크가 실제로 보이는 중일 때만 배운 것으로 친다 — 안내 뒤에 가려진 채 눌린 건 셈하지 않는다
  const tapPartner = () => {
    onTap();
    if (!coaching) return;
    tapGreetingSeen.mark();
    setCoachOpen(false);
  };

  // 켜져 있는 동안 Tab(Shift+Tab 포함)을 삼켜 포커스가 캐릭터 밖으로 못 나가게 한다
  const trapFocus = (event: KeyboardEvent) => {
    if (coaching && event.key === 'Tab') event.preventDefault();
  };

  return { guideOpen, coaching, closeGuide, tapPartner, partnerRef, trapFocus };
};
