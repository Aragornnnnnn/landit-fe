// 환급 화면이 무엇을 그릴지 한 번에 정한다 — 본문과 아래 버튼이 같은 판정을 본다
import type { RewardView } from '@/features/reward/api/reward';

export type RefundView =
  // 참여자 — 쌓인 금액과 내역
  | { kind: 'record'; reward: RewardView }
  // 권할 사람 — 환급 소개
  | { kind: 'intro' }
  | { kind: 'error'; error: Error }
  | { kind: 'loading' }
  // 환급과 상관없는 사람 — 홈으로 보낸다
  | { kind: 'outsider' };

export const refundViewOf = ({
  reward,
  error,
  loaded,
  fetching,
  invited,
  settled,
}: {
  // 참여자가 아니면 null
  reward: RewardView | null;
  error: Error | null;
  // 환급 응답을 한 번이라도 받았는가
  loaded: boolean;
  // 환급을 다시 받는 중 — 결제 직후처럼 받아 둔 답이 곧 바뀔 수 있다
  fetching: boolean;
  invited: boolean;
  settled: boolean;
}): RefundView => {
  if (reward) return { kind: 'record', reward };
  // 받은 적이 있으면 다시 받기가 실패해도 보던 화면을 지킨다
  if (error && !loaded) return { kind: 'error', error };
  if (invited) return { kind: 'intro' };
  // 다시 받는 중에는 내보내지 않는다 — 방금 결제한 사람을 옛 답으로 홈에 보내면 안 된다
  return { kind: settled && !fetching ? 'outsider' : 'loading' };
};
