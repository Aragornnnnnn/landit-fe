'use client';

// 스몰톡 말하기 한도 — 무료 사용자는 처음 5분만 써 볼 수 있어 남은 시간(홈 알약 잔량, 마이크 카운트다운·타이머 링)을 보여 준다.
// 학습 문이 열린 사람(구독 중·결제가 없는 환경)은 무제한이다 (docs/subscription.md 「스몰톡 말하기 한도」)
// 가로 import 사유: 한도는 무료 구간의 일부라 같은 게이트 판정을 쓴다
import { usePaywallGate } from '@/features/subscription/model/paywall-gate/usePaywallGate';

export const useSpeakingLimit = () => {
  const { locked } = usePaywallGate();
  return { unlimited: !locked };
};
