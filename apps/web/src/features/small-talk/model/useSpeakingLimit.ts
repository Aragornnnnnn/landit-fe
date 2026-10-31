'use client';

// 스몰톡 말하기 한도 — 무료 사용자는 처음 5분만 써 볼 수 있어 남은 시간(홈 알약 잔량, 마이크 카운트다운·타이머 링)을 보여 준다.
// 구독 중이면 무제한이다 — 서버가 무제한이라 하거나 학습 문이 열렸으면 그렇다 (docs/subscription.md 「스몰톡 말하기 한도」).
// 구독을 아직 못 받아 판정 중이면 한도 있음으로 본다 — 잠깐 무제한으로 보였다가 줄어드는 것보다, 잠깐 남은 시간이 보였다가 무제한이 되는 편이 낫다.
// 서버가 무료 5분 정책을 아직 안 켰으면(적용 시각 전) 예전처럼 누구에게나 무제한 표시다 — 무료 사용자는 시작에서 페이월이 막는다
// 가로 import 사유: 한도는 무료 구간의 일부라 같은 게이트 판정을 쓴다
import { usePaywallGate } from '@/features/subscription/model/paywall-gate/usePaywallGate';

import { useSmallTalkMainQuery } from './useSmallTalkMainQuery';

export const useSpeakingLimit = () => {
  const { locked, deciding } = usePaywallGate();
  // 메인은 이 훅을 쓰는 화면(스몰톡 탭·대화)이 이미 받아 두었다 — 여기선 캐시만 읽고 따로 조회하지 않는다
  const { main } = useSmallTalkMainQuery({ enabled: false });
  // 메인을 아직 못 받았으면 꺼진 것으로 본다 — 켜진 줄 알고 문을 먼저 열면 서버가 막는다
  const trialOn = main?.freeTrialEnabled === true;
  return {
    unlimited: !trialOn || main?.unlimited === true || (!locked && !deciding),
    trialOn,
  };
};
