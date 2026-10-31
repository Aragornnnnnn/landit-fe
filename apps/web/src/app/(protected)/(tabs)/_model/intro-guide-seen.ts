// 스몰톡 첫 안내를 본 기기인지 — 스몰톡 화면이 한 번 띄우고, 탭 셸이 칩 점을 붙일지 정할 때 같이 본다
import { seenFlag } from '@/shared/lib/seen-flag';
import { useSeenFlag } from '@/shared/lib/useSeenFlag';

// 안내 내용이 바뀌면 v를 올려 본 사람에게도 한 번 더 띄운다 — v3는 무료 5분 안내(2026-10-30), 기존 무료 사용자도 다시 본다
export const introGuideSeen = seenFlag('landit-smalltalk-intro-guide-seen-v3');

// 바뀌기 전 안내들의 기록 — 예전 안내를 본 구독자는 새로 알릴 무료 5분이 없어 새 안내를 건너뛴다
const introGuideSeenV1 = seenFlag('landit-smalltalk-intro-guide-seen');
const introGuideSeenV2 = seenFlag('landit-smalltalk-intro-guide-seen-v2');
const oldIntroGuideSeen = [introGuideSeenV1, introGuideSeenV2];

/** 예전 안내를 본 기기인가 — 렌더 밖(안내를 띄울지 처음 정할 때)에서 읽는다 */
export const sawOldIntroGuide = () =>
  oldIntroGuideSeen.some((flag) => flag.has());

/** 예전 안내를 본 기기인가 — 화면이 지켜본다. 서버에선 본 것으로 답한다 */
export const useSawOldIntroGuide = () => {
  const sawV1 = useSeenFlag(introGuideSeenV1);
  const sawV2 = useSeenFlag(introGuideSeenV2);
  return sawV1 || sawV2;
};

/**
 * 예전 안내를 본 구독자라 새 안내를 건너뛰는가 — 구독자에겐 새로 알릴 무료 5분이 없다
 * @param premium 학습 문이 열린 사람(구독 중). 구독 판정 중이면 false
 */
export const skipsIntroForPremium = ({
  sawOld,
  premium,
}: {
  sawOld: boolean;
  premium: boolean;
}) => premium && sawOld;

/** 바뀌기 전 안내의 기록을 지운다 — 새 안내를 보고 나면 읽을 곳이 없어 기기에 남겨 둘 이유가 없다 */
export const clearOldIntroGuideSeen = () => {
  oldIntroGuideSeen.forEach((flag) => flag.clear());
};
