// 프리미엄 혜택 다섯 줄 — 2026-09-07 확정 문구 그대로. 아이콘은 shared/ui/Icons의 라인 아이콘 이름으로 가리킨다
export type BenefitIcon = 'calendar' | 'chat' | 'sparkles' | 'mic' | 'globe';

export interface Benefit {
  icon: BenefitIcon;
  text: string;
}

export const PAYWALL_BENEFITS: Benefit[] = [
  { icon: 'calendar', text: '매일 새로운 시나리오 제공' },
  { icon: 'chat', text: '무제한 프리톡' },
  { icon: 'sparkles', text: '수준별 원어민 표현 추천' },
  { icon: 'mic', text: '원어민에 가까운 발음 교정' },
  { icon: 'globe', text: '미국, 영국, 호주식 영어 공부' },
];
