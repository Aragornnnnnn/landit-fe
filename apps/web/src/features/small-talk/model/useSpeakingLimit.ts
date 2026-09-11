'use client';

// 스몰톡 하루 말하기 한도 — 결제가 열린 환경에서는 한도 없이 말한다 (docs/subscription.md 「스몰톡 말하기 한도」).
// 무제한이어도 잔량 계산(useSpeakingBudget)은 그대로 돈다. 표시만 가리므로 무료 사용자 한도가 생기면 여기에 구독 여부를 더한다
// 결제 환경 판정은 subscription이 갖고 있다 — 페이월과 같은 기준을 쓰려고 가로 import한다
import { usePaymentLive } from '@/features/subscription/model/usePaymentLive';

export const useSpeakingLimit = () => ({ unlimited: usePaymentLive() });
