// 프리미엄 혜택 여섯 줄 — 기획 원문 그대로. 아이콘은 shared/ui/Icons의 라인 아이콘 이름으로 가리킨다
export type BenefitIcon =
  'calendar' | 'globe' | 'sparkles' | 'mic' | 'chat' | 'heart';

export interface Benefit {
  icon: BenefitIcon;
  text: string;
}

export const PAYWALL_BENEFITS: Benefit[] = [
  { icon: 'calendar', text: '매일 새로운 시나리오 회화 1개 제공' },
  { icon: 'globe', text: '미국식·영국식·호주식 다양한 억양 체험' },
  // 문구 확정 전 — 추천뿐 아니라 학습까지 담는 표현으로 바뀔 예정 (docs/subscription.md 「페이월 화면」)
  { icon: 'sparkles', text: '나에게 꼭 맞는 원어민 표현 추천' },
  { icon: 'mic', text: '발음 평가로 원어민에 가까운 발음 교정' },
  { icon: 'chat', text: '원어민 캐릭터와의 무제한 프리톡' },
  { icon: 'heart', text: '이전 대화를 기억하는 진짜 친구 같은 대화' },
];
