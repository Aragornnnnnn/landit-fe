'use client';

// 스몰톡 하루 말하기 한도 — 지금은 누구에게나 무제한이라 한도 표시(홈 알약 잔량, 마이크 카운트다운·타이머 링)를 가린다 (docs/subscription.md 「스몰톡 말하기 한도」).
// 무제한이어도 잔량 계산(useSpeakingBudget)은 그대로 돈다
// TODO: 무료 사용자 한도가 다시 생기면 여기서 구독 여부로 판정한다
export const useSpeakingLimit = () => ({ unlimited: true });
