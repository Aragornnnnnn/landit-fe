'use client';

// 스몰톡 홈의 첫 안내 — 처음 온 기기에 한 번 띄우고 문장·비출 자리·진행 단계를 든다(화면은 그리기만 한다)
import { useEffect, useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';

import {
  clearOldIntroGuideSeen,
  introGuideSeen,
  sawOldIntroGuide,
  skipsIntroForPremium,
} from '../../_model/intro-guide-seen';
import { tapGreetingSeen } from '../../_model/tap-greeting-seen';
import {
  introSentencesOf,
  introSpotlightsOf,
  type IntroSpotlight,
} from './intro-sentences';

/**
 * onTap — 캐릭터를 눌렀을 때 할 일(인사 시작)
 * held — 화면 위에 더 급한 것(강제 업데이트·조회 중·구독 판정 중·주제 고르기)이 있다. 풀릴 때까지 안내를 띄우지 않는다
 * copy — 래디 문장의 원문(t.raw). 한 자씩 쓰려면 태그가 남은 글자가 필요하다
 * free·exhausted — 받은 무료 시간 알약을 비출지. 안내가 뜨는 순간 정해 두고 바꾸지 않는다
 * premium — 학습 문이 열린 사람(구독 중). 예전 안내를 봤으면 새로 알릴 무료 5분이 없어 새 안내를 건너뛴다
 * trialOn — 서버가 무료 5분 정책을 켰는가. 무료 사용자는 켜질 때까지 안내를 미룬다(5분 단계 없이 안내를 써 버리지 않게)
 */
export const useIntroGuide = ({
  onTap,
  held = false,
  copy,
  free,
  premium,
  trialOn,
  exhausted,
}: {
  onTap: () => void;
  held?: boolean;
  copy: { freeTalkBody: string; endingBody: string };
  free: boolean;
  premium: boolean;
  trialOn: boolean;
  exhausted: boolean;
}) => {
  // 서버 렌더엔 localStorage가 없어 안 본 것으로 두고, 하이드레이션 뒤 첫 상태 계산에서 본 기록이 반영된다
  const [guideUnseen, setGuideUnseen] = useState(() => !introGuideSeen.has());
  // 예전 안내를 본 구독자는 건너뛴다 — 구독 판정이 끝난 뒤(붙잡힘이 풀린 뒤)에 정한다
  const skipsForPremium =
    !held &&
    guideUnseen &&
    skipsIntroForPremium({ sawOld: sawOldIntroGuide(), premium });
  // 무료 사용자는 정책이 켜질 때까지 기다린다 — 켜지기 전에 보면 무료 5분 단계를 영영 못 본다
  const waitsForTrial = !premium && !trialOn;
  const guideOpen = !held && !waitsForTrial && guideUnseen && !skipsForPremium;
  // 건너뛴 것도 본 것으로 남긴다 — 탭 칩 점이 사라지고 다음 방문에 다시 정하지 않는다. 닫기 계측은 남기지 않는다
  useEffect(() => {
    if (skipsForPremium) introGuideSeen.mark();
  }, [skipsForPremium]);

  // 비출 자리는 안내가 뜨는 순간 고정한다 — 도중에 구독이 와서 자리가 줄면 비추던 자리가 사라져 어둠만 남긴 채 멈춘다
  const [spotlights, setSpotlights] = useState<IntroSpotlight[] | null>(null);
  if (guideOpen && spotlights === null)
    setSpotlights(introSpotlightsOf({ free, exhausted }));
  // 래디의 말이 끝난 뒤 몇 번째 자리를 비추는 중인가 — null이면 아직 래디 차례
  const [spot, setSpot] = useState<number | null>(null);
  const spotlight =
    guideOpen && spot !== null && spotlights !== null
      ? (spotlights[spot] ?? null)
      : null;

  const close = () => {
    track(EVENTS.SMALL_TALK_INTRO_GUIDE_CLOSED);
    introGuideSeen.mark();
    clearOldIntroGuideSeen();
    setGuideUnseen(false);
  };

  // 다음 자리로 — 래디의 말이 끝났거나 비춘 자리를 다 읽었다. 마지막 자리 뒤엔 닫는다
  const next = () => {
    const following = spot === null ? 0 : spot + 1;
    if (following >= (spotlights?.length ?? 0)) close();
    else setSpot(following);
  };

  const tapPartner = () => {
    onTap();
    tapGreetingSeen.mark();
  };

  return {
    guideOpen,
    // 안내를 이미 본 기기인가 — 캐릭터 옆 힌트는 안내를 본 뒤에만 띄운다. 안내가 뜨기 전에 먼저 번쩍이면 안 된다
    guideSeen: !guideUnseen || skipsForPremium,
    sentences: introSentencesOf(copy),
    spotlights: spotlights ?? [],
    spot,
    spotlight,
    next,
    close,
    tapPartner,
  };
};
