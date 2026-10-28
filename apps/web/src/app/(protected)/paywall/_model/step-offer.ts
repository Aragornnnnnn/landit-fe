// 단계형 페이월이 결제 단계에서 파는 것 — 환급 챌린지는 100일 이용권 한 장, 일본어 화면은 월간·연간 구독(환급은 한국에서만 판다)
import type {
  PaywallPlan,
  RegularPlan,
} from '@/features/subscription/model/product/plans';

import type { RewardPlan } from './paywall-content';

export type StepOffer =
  | { kind: 'pass'; plan: RewardPlan }
  | {
      kind: 'subscription';
      plans: Record<RegularPlan, PaywallPlan>;
      selectedId: RegularPlan;
      onSelect: (id: RegularPlan) => void;
    };
