// 헤더 환급 알약의 모양 — 헤더의 알약과, 동전 연출이 어둠 위에 다시 그리는 알약이 같은 모양이어야 겹쳐 보인다.
// 곡률과 세로 여백은 프리미엄 진입 알약(PremiumHeaderEntry의 PILL_CLASS)과 맞춘다 — 한쪽을 바꾸면 같이 본다
export const REFUND_PILL_CLASS =
  'flex items-center gap-1.5 rounded-[10px] py-1.5 pr-3 pl-2 text-[15px] leading-[1.2] font-black';
// 오늘 했을 때의 금빛
export const REFUND_PILL_GOLD = 'animate-gold-flow text-[#4a2f00]';
// 알약 속 동전의 크기와, 알약 왼쪽 끝에서 동전 가운데까지의 거리(왼쪽 여백 8px + 동전 반지름) — 날아든 동전이 닿는 자리다
export const REFUND_PILL_COIN = 20;
export const REFUND_PILL_COIN_CENTER_X = 8 + REFUND_PILL_COIN / 2;
