'use client';

// 홈 스몰톡 칩 말풍선(무료 5분)을 띄울지 정한다 — 탭 셸은 이 답을 그리기만 한다.
// 대상: 프리미엄 프리뷰의 무료 표현을 끝까지 마친 무료 사용자. 스몰톡 탭을 한 번 보면 영영 끝.
// 하루 한 번(그날 첫 홈 방문)만 띄우고, 그 차례엔 홈의 다른 시트가 기다린다. 할인 시트·환급 동전 연출만 앞이다
import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';

import { usePreviewStep } from '@/features/premium-preview/model/usePreviewStep';
// 가로 import 사유: 말풍선이 말하는 무료 한도는 스몰톡 서버 값 그대로다
import { toSpeakingTimeLabel } from '@/features/small-talk/lib/speaking-time';
import { useSmallTalkMainQuery } from '@/features/small-talk/model/useSmallTalkMainQuery';
// 가로 import 사유: 말풍선은 무료 사용자에게만 뜬다 — 같은 게이트 판정을 쓴다
import { usePromoSheetOpen } from '@/features/subscription/model/exit-promo/promo-handoff';
import { usePaywallGate } from '@/features/subscription/model/paywall-gate/usePaywallGate';
import { useSeenFlag } from '@/shared/lib/useSeenFlag';

import {
  markNudgeShownToday,
  nudgeShownToday,
  setFreeNudgeFirst,
  smalltalkNudgeSeen,
} from './smalltalk-free-nudge';
import { useEarnShowerHold } from './useEarnShowerHold';

/**
 * @param onSmalltalk 지금 스몰톡 탭을 보고 있다 — 말풍선이 가리키던 곳에 와 있으니 할 말을 한 것이다
 */
export const useFreeNudge = ({ onSmalltalk }: { onSmalltalk: boolean }) => {
  const { locked, deciding } = usePaywallGate();
  const { step } = usePreviewStep();
  const finished = step === 'FREE_FINISHED';
  const nudgeSeen = useSeenFlag(smalltalkNudgeSeen);
  // 아직 말풍선을 볼 수 있는 사람인가 — 마쳤고, 스몰톡을 아직 안 봤다. 무료인지는 아래서 따로 본다
  const pending = finished && !nudgeSeen;

  // 스몰톡 화면을 봤으면 끝이다 — 그날 말풍선이 떴든 아니든. 칩을 눌렀든 마지막 탭으로 들어왔든 같다
  useEffect(() => {
    if (pending && onSmalltalk) smalltalkNudgeSeen.mark();
  }, [pending, onSmalltalk]);

  // 하루 한 번만 — 그날 첫 홈 방문에 띄우고, 이 셸이 떠 있는 동안은 계속 둔다(탭을 오가도 셸은 그대로다).
  // 서버 렌더엔 저장소가 없어 보여 준 것으로 두고, 하이드레이션 뒤 첫 상태 계산에서 기록이 반영된다
  const [dueToday, setDueToday] = useState(
    () => typeof window !== 'undefined' && !nudgeShownToday(),
  );
  // 칩을 누르면 남은 날에도 다시 안 뜬다 — 탭을 봤다는 기록이 우선이다
  if (nudgeSeen && dueToday) setDueToday(false);

  // 말풍선 차례 — 구독을 아직 못 받아 무료인지 모르는 동안도 차례로 둔다. 그사이 공지가 먼저 뜨면 말풍선이 그 아래에서 뒤늦게 뜬다
  const nudgeFirst =
    pending && dueToday && !onSmalltalk && (locked || deciding);
  useEffect(() => {
    setFreeNudgeFirst(nudgeFirst);
    return () => setFreeNudgeFirst(false);
  }, [nudgeFirst]);

  // 한도는 서버 값이다 — 받기 전엔 숫자 없는 말풍선을 띄우지 않고 기다린다
  const { main } = useSmallTalkMainQuery({ enabled: nudgeFirst });
  const promoOpen = usePromoSheetOpen();
  const showerHold = useEarnShowerHold();
  const showsNudge =
    nudgeFirst && locked && main !== null && !promoOpen && !showerHold;
  // 실제로 떴을 때 오늘 보여 준 것으로 남긴다 — 띄우기 전에 남기면 한도 조회가 늦은 날은 보여 주지도 않고 하루를 쓴다
  useEffect(() => {
    if (showsNudge) markNudgeShownToday();
  }, [showsNudge]);

  const locale = useLocale();
  return {
    showsNudge,
    // 말풍선에 적을 한도("5분") — 뜨지 않을 땐 null
    limitLabel:
      showsNudge && main
        ? toSpeakingTimeLabel(main.dailySpeakingTimeLimitMs, locale)
        : null,
    // 칩을 눌렀다 — 누른 순간 끈다. 화면이 바뀌길 기다리면 전환 동안 말풍선이 남는다
    dismiss: () => {
      if (pending) smalltalkNudgeSeen.mark();
    },
  };
};
