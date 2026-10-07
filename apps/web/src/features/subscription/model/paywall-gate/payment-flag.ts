// 결제 스위치 — 결제를 막아야 할 때 끄는 웹 플래그. 꺼지면 페이월 잠금과 결제 진입이 함께 사라진다 (docs/subscription.md 「페이월 노출 조건」)
// NEXT_PUBLIC_이라 빌드 시점에 박힌다. 바꾸면 재배포가 필요하다
export const PAYMENT_ENABLED =
  process.env.NEXT_PUBLIC_PAYMENT_ENABLED === 'true';
