'use client';

// 스몰톡 말하기 한도 — 무료 5분 정책이 켜졌으면 서버가 말한 무제한 여부를 따르고, 꺼졌으면(적용 시각 전) 누구에게나 무제한 표시다
// (docs/subscription.md 「스몰톡 말하기 한도」). 한도가 있으면 홈 알약 잔량·마이크 카운트다운·타이머 링을 그리고 키보드를 닫는다
import { useSmallTalkMainQuery } from './useSmallTalkMainQuery';

export const useSpeakingLimit = () => {
  // 메인은 이 훅을 쓰는 화면(스몰톡 탭·대화)이 이미 받아 두었다 — 여기선 캐시만 읽고 따로 조회하지 않는다
  const { main } = useSmallTalkMainQuery({ enabled: false });
  // 메인을 아직 못 받았으면 꺼진 것으로 본다 — 켜진 줄 알고 문을 먼저 열면 서버가 막는다
  const trialOn = main?.freeTrialEnabled === true;
  // 서버가 구독으로 판정한다 — 구독 판정 중에도, 결제가 없는 환경에서도 실제 차감과 표시가 맞는다
  return { unlimited: !trialOn || main?.unlimited === true, trialOn };
};
