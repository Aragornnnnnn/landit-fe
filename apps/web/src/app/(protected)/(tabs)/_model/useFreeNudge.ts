'use client';

// 홈 스몰톡 칩 말풍선(무료 5분)을 띄울지 정한다 — 탭 셸은 이 답을 그리기만 한다.
// 대상: 시나리오 대화의 피드백을 본 무료 사용자. 표현을 마쳤든 중간에 나갔든 프리뷰를 건너뛰었든 같다. 스몰톡 탭을 한 번 보면 영영 끝.
// 홈을 덮는 것(강제 업데이트·배울 영어 묻기·램프·프리뷰·할인 시트·동전 연출)이 있는 동안은 기다린다 — 가려진 채 하루 몫을 쓰지 않는다.
// 하루 한 번(그날 첫 홈 방문)만 띄우고, 뜬 뒤 잠깐만 홈의 다른 시트(공지·소감·알림 동의)를 앞에서 막는다.
// 칩을 안 누르고 머물러도, 판정이 끝나지 않아 못 떠도 그 방문의 시트들은 곧 나선다
import { useEffect, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useLocale } from 'next-intl';

import { useForceUpdateFirst } from '@/features/app-update/model/useForceUpdateFirst';
import { useAskingAccent } from '@/features/onboarding/model/useAskingAccent';
import { toSpeakingTimeLabel } from '@/features/small-talk/lib/speaking-time';
import { useSmallTalkMainQuery } from '@/features/small-talk/model/useSmallTalkMainQuery';
import { usePromoSheetOpen } from '@/features/subscription/model/exit-promo/promo-handoff';
import { usePaywallGate } from '@/features/subscription/model/paywall-gate/usePaywallGate';
import { track } from '@/shared/analytics';
import { useSeenFlag } from '@/shared/lib/useSeenFlag';

import { scenarioFeedbackSeen } from '../../_model/scenario-feedback-seen';
import { usePremiumPreview } from '../../_model/usePremiumPreview';
import {
  markNudgeShownToday,
  nudgeShownToday,
  setFreeNudgeFirst,
  smalltalkNudgeSeen,
  useLampSummonOpen,
} from './smalltalk-free-nudge';
import { useEarnShowerHold } from './useEarnShowerHold';

// 말풍선이 뜬 뒤 다른 시트를 앞에서 막는 시간 — 말풍선을 먼저 읽게 하고 그다음은 비켜 준다
export const NUDGE_LEAD_MS = 2500;
// 차례를 잡고도 판정(구독·한도)이 안 끝나 못 뜰 때 기다리는 한도 — 넘기면 그 방문엔 비켜 준다
export const NUDGE_WAIT_MS = 4000;

/**
 * @param onSmalltalk 지금 스몰톡 탭을 보고 있다 — 말풍선이 가리키던 곳에 와 있으니 할 말을 한 것이다
 */
export const useFreeNudge = ({ onSmalltalk }: { onSmalltalk: boolean }) => {
  const { locked, deciding } = usePaywallGate();
  const feedbackSeen = useSeenFlag(scenarioFeedbackSeen);
  const nudgeSeen = useSeenFlag(smalltalkNudgeSeen);
  // 프리뷰가 홈을 차지하고 있다 — 튜토리얼·카드 뒤집기·무료 표현 차례. 끝나거나 중간에 나가면(FREE_OPENED) 그때 뜬다
  const previewOnScreen = usePremiumPreview().screen !== 'none';
  // 아직 말풍선을 볼 수 있는 사람인가 — 피드백을 봤고, 스몰톡을 아직 안 봤다. 무료인지는 아래서 따로 본다
  const pending = feedbackSeen && !nudgeSeen;

  // 스몰톡 화면을 봤으면 끝이다 — 그날 말풍선이 떴든 아니든. 칩을 눌렀든 마지막 탭으로 들어왔든 같다
  useEffect(() => {
    if (pending && onSmalltalk) smalltalkNudgeSeen.mark();
  }, [pending, onSmalltalk]);

  // 하루 한 번만 — 그날 첫 홈 방문에 띄우고, 이 셸이 떠 있는 동안은 계속 둔다(탭을 오가도 셸은 그대로다).
  // 서버 렌더엔 저장소가 없어 보여 준 것으로 두고, 하이드레이션 뒤 첫 상태 계산에서 기록이 반영된다
  const [dueToday] = useState(
    () => typeof window !== 'undefined' && !nudgeShownToday(),
  );

  // 말풍선 후보 — 오늘 띄울 사람이고 프리뷰가 비켰다. 구독을 아직 못 받아 무료인지 모르는 동안도 후보로 둔다
  const candidate =
    pending &&
    dueToday &&
    !onSmalltalk &&
    !previewOnScreen &&
    (locked || deciding);

  // 홈을 덮는 것 — 그 아래 깔린 말풍선은 보이지 않으니 띄우지도, 하루 몫을 쓰지도 않는다
  const updateFirst = useForceUpdateFirst();
  const askingAccent = useAskingAccent();
  const lampOpen = useLampSummonOpen();
  const promoOpen = usePromoSheetOpen();
  const showerHold = useEarnShowerHold();
  const covered =
    updateFirst || askingAccent || lampOpen || promoOpen || showerHold;

  // 한도는 서버 값이다 — 받기 전엔 숫자 없는 말풍선을 띄우지 않고 기다린다.
  // 서버가 무료 5분 정책을 아직 안 켰다고 확인됐으면 줄 5분이 없다 — 띄우지도, 차례를 잡지도 않고 켜질 때를 기다린다.
  // 메인을 아직 못 받았으면 꺼졌는지 모르니 차례는 쥔 채 기다린다
  const { main } = useSmallTalkMainQuery({ enabled: candidate });
  const trialKnownOff = main !== null && main.freeTrialEnabled !== true;

  // 차례를 내려놓은 방식 — 이번 방문(셸이 떠 있는 동안)만 기억한다. 뜬 뒤 잠깐 지나면 'shown', 못 뜬 채 한참 지나면 'gave-up'.
  // 덮는 것이 있는 동안은 시계를 멈춘다 — 덮개가 걷히기 전에 차례가 끝나 시트와 말풍선이 같이 나서지 않게
  const [released, setReleased] = useState<'shown' | 'gave-up' | null>(null);
  // 못 뜬 채 비켜 준 방문엔 판정이 늦게 끝나도 띄우지 않는다 — 그새 나선 공지·소감과 겹친다
  const showsNudge =
    candidate &&
    locked &&
    main !== null &&
    !trialKnownOff &&
    !covered &&
    released !== 'gave-up';
  useEffect(() => {
    if (!candidate || covered || released !== null) return;
    const timer = setTimeout(
      () => setReleased(showsNudge ? 'shown' : 'gave-up'),
      showsNudge ? NUDGE_LEAD_MS : NUDGE_WAIT_MS,
    );
    return () => clearTimeout(timer);
  }, [candidate, covered, released, showsNudge]);

  // 말풍선 차례 — 이 동안 홈의 공지·소감·알림 동의가 기다린다
  const nudgeFirst = candidate && released === null && !trialKnownOff;
  useEffect(() => {
    setFreeNudgeFirst(nudgeFirst);
    return () => setFreeNudgeFirst(false);
  }, [nudgeFirst]);
  // 실제로 떴을 때 오늘 보여 준 것으로 남긴다 — 띄우기 전에 남기면 한도 조회가 늦은 날은 보여 주지도 않고 하루를 쓴다
  // 노출도 하루 한 번만 센다 — 같은 방문에 덮개가 걷혀 다시 떠도 두 번 세지 않는다
  useEffect(() => {
    if (!showsNudge || nudgeShownToday()) return;
    markNudgeShownToday();
    track(EVENTS.SMALL_TALK_FREE_NUDGE_VIEWED);
  }, [showsNudge]);

  const locale = useLocale();
  return {
    // 띄울 말풍선 — 적을 한도("5분")를 담는다. 뜨지 않을 땐 null
    nudge:
      showsNudge && main
        ? {
            limitLabel: toSpeakingTimeLabel(
              main.dailySpeakingTimeLimitMs,
              locale,
            ),
          }
        : null,
    // 칩을 눌렀다 — 누른 순간 끈다. 화면이 바뀌길 기다리면 전환 동안 말풍선이 남는다
    dismiss: () => {
      if (showsNudge) track(EVENTS.SMALL_TALK_FREE_NUDGE_TAPPED);
      if (pending) smalltalkNudgeSeen.mark();
    },
  };
};
