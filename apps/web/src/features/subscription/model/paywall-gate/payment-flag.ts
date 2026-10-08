// 결제 스위치 — 결제를 막아야 할 때 끄는 웹 플래그. 꺼지면 페이월 잠금과 결제 진입이 함께 사라진다 (docs/subscription.md 「페이월 노출 조건」)
// NEXT_PUBLIC_이라 빌드 시점에 박힌다. 바꾸면 재배포가 필요하다
export const PAYMENT_ENABLED =
  process.env.NEXT_PUBLIC_PAYMENT_ENABLED === 'true';

// 환급 챌린지 스위치 — 3·6개월 환급 상품이 심사를 통과하면 켠다. 꺼져 있으면 롱 페이월이 환급 무대·환급 플랜 없이 지금 플랜(월간·연간)으로 보인다
export const REFUND_CHALLENGE_ENABLED =
  process.env.NEXT_PUBLIC_REFUND_CHALLENGE === 'true';
