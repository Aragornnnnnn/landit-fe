// 결제 스위치 — 결제를 막아야 할 때 끄는 웹 플래그. 꺼지면 페이월 잠금과 결제 진입이 함께 사라진다 (docs/subscription.md 「페이월 노출 조건」)
// NEXT_PUBLIC_이라 빌드 시점에 박힌다. 바꾸면 재배포가 필요하다
export const PAYMENT_ENABLED =
  process.env.NEXT_PUBLIC_PAYMENT_ENABLED === 'true';

// 환급 챌린지 스위치 — 3·6개월 환급 상품이 심사를 통과하면 켠다. 환급 기능을 실은 배포인지를 말하고, 화면은 이 값을 바로 보지 않고 판매 규칙(offers/useOffers)을 본다 — 지금 파는지는 종료 시각(offers/offer-schedule)이 따로 정한다. 꺼져 있으면 이미 산 사람의 환급 화면도 없다
export const REWARD_CHALLENGE_ENABLED =
  // 환경변수 이름은 옛 이름 그대로 둔다 — 출시하면 스위치째로 지운다
  process.env.NEXT_PUBLIC_REFUND_CHALLENGE === 'true';
