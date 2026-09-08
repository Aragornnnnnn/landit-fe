// 결제 오픈 플래그 — 심사 기간과 오픈 시점을 가르는 웹 스위치 (docs/subscription.md 「페이월 노출 조건」)
// NEXT_PUBLIC_이라 빌드 시점에 박힌다. 바꾸면 재배포가 필요하고, 켜져 있어도 앱 버전 게이트가 먼저 걸러 준다
export const PAYMENT_ENABLED =
  process.env.NEXT_PUBLIC_PAYMENT_ENABLED === 'true';
