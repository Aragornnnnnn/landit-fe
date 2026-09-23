// 결제 오픈 플래그 — 심사 기간과 오픈 시점을 가르는 웹 스위치 (docs/subscription.md 「페이월 노출 조건」)
// NEXT_PUBLIC_이라 빌드 시점에 박힌다. 바꾸면 재배포가 필요하고, 켜져 있어도 앱 버전 게이트가 먼저 걸러 준다
export const PAYMENT_ENABLED =
  process.env.NEXT_PUBLIC_PAYMENT_ENABLED === 'true';

// 이탈 할인 스위치 — 스토어 설정과 무관하게 웹에서 끄고 켠다. 정가 인상 시점과 노출 시점을 맞추거나,
// 문제가 생겼을 때 오퍼링을 건드리지 않고 되돌리는 데 쓴다. 꺼져 있으면 이탈을 서버에 알리지도 않는다
export const PROMO_ENABLED = process.env.NEXT_PUBLIC_PROMO_ENABLED === 'true';
