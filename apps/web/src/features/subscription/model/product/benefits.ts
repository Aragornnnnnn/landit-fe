// 혜택 목록 — 페이월 비교표(무료 vs 프리미엄)와 구독 관리 "이용 중인 혜택"이 같은 목록을 쓴다.
// 무료로도 되는 줄은 위에, 프리미엄 전용은 아래에 둔다 (LAN-500). 아이콘은 shared/ui/Icons의 라인 아이콘 이름으로 가리킨다
export type BenefitLabelKey =
  | 'dailyScenarioLabel'
  | 'detailFeedbackLabel'
  | 'phraseLabel'
  | 'pronunciationLabel'
  | 'smallTalkLabel'
  | 'accentLabel';

export type BenefitIcon =
  'calendar' | 'list-checks' | 'chat' | 'sparkles' | 'mic' | 'globe';

export interface Benefit {
  /** 목록(`BenefitList`)이 그릴 라인 아이콘. 비교표는 아이콘을 쓰지 않는다 */
  icon: BenefitIcon;
  /** 문구 키 — subscription.benefits 아래 */
  labelKey: BenefitLabelKey;
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
  { icon: 'calendar', labelKey: 'dailyScenarioLabel', free: true },
  { icon: 'list-checks', labelKey: 'detailFeedbackLabel', free: false },
  { icon: 'sparkles', labelKey: 'phraseLabel', free: false },
  { icon: 'mic', labelKey: 'pronunciationLabel', free: false },
  { icon: 'chat', labelKey: 'smallTalkLabel', free: false },
  { icon: 'globe', labelKey: 'accentLabel', free: false },
];

/** 구독 관리의 "이용 중인 혜택"이 쓰는 목록 — 돈 내고 쓰는 것만 센다 */
export const PREMIUM_BENEFITS = BENEFITS.filter((benefit) => !benefit.free);
