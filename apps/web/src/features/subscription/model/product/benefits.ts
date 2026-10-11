// 혜택 목록 — 페이월 비교표(무료 vs 프리미엄)와 구독 관리 "이용 중인 혜택"이 같은 목록을 쓴다.
// 무료로도 되는 줄은 위에, 프리미엄 전용은 아래에 둔다 (LAN-500). 아이콘은 shared/ui/Icons의 라인 아이콘 이름으로 가리킨다
export type BenefitIcon =
  'calendar' | 'list-checks' | 'chat' | 'sparkles' | 'mic' | 'globe';

export interface Benefit {
  /** 목록(`BenefitList`)이 그릴 라인 아이콘. 비교표는 아이콘을 쓰지 않는다 */
  icon: BenefitIcon;
  text: string;
  /** 무료 사용자도 쓰는가 — 비교표의 무료 열에 체크가 들어간다 */
  free: boolean;
}

/**
 * 페이월 비교표가 그리는 여섯 줄. 무료 줄이 먼저 오고 그 아래가 프리미엄 전용이다 —
 * 섞이면 무료 열의 체크가 띄엄띄엄 보인다 (순서는 `benefits.test.ts`가 지킨다).
 *
 * 무료 구간 확대(LAN-498)로 시나리오 대화가 무료가 됐고, 나머지 다섯은 2026-09-07 확정 문구에
 * 상세 피드백을 더한 것이다.
 */
export const BENEFITS: Benefit[] = [
  { icon: 'calendar', text: '매일 새로운 시나리오 대화', free: true },
  { icon: 'list-checks', text: '문장마다 상세 피드백', free: false },
  { icon: 'sparkles', text: '수준별 원어민 표현 추천', free: false },
  { icon: 'mic', text: '원어민에 가까운 발음 교정', free: false },
  { icon: 'chat', text: '무제한 프리톡', free: false },
  { icon: 'globe', text: '미국, 영국, 호주식 영어 공부', free: false },
];

/** 구독 관리의 "이용 중인 혜택"이 쓰는 목록 — 돈 내고 쓰는 것만 센다 */
export const PREMIUM_BENEFITS = BENEFITS.filter((benefit) => !benefit.free);
