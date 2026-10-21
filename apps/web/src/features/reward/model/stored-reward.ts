// 환급을 아직 시작하지 않은 사람에게 보관 중인 적립금 — 초대 코드로 가입해 받은 돈처럼 결제 전에 들어온 몫이다.
// 결제하면 그 회차에 합쳐져 기간이 끝날 때 함께 돌려받는다
import type { RewardView } from '../api/reward';
import { participantOf, type RewardBadge } from './reward-status';

export const storedRewardWonOf = (view: RewardView) =>
  participantOf(view) ? 0 : Math.max(view.balanceWon ?? 0, 0);

// 내 정보 타일 — 보관 중인 돈이 있으면 「환급 최대」 대신 그 금액을 말한다
export const storedRewardBadgeOf = (storedWon: number): RewardBadge => ({
  label: '쌓인 환급액',
  amountWon: storedWon,
  note: '시작하면 돌려받아요',
  mood: 'kept',
});
