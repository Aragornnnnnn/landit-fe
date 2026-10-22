// 시나리오 대화를 끝낸 순간 받은 금액을 보여 줄지 정하는 규칙 — 마지막 발화 응답에 실려 온 적립 영수증을 읽는다
import type { RewardCompletion } from '../api/reward';

export interface CompletionEarn {
  earnedWon: number;
}

/**
 * 날짜는 보지 않는다 — 자정 전에 시작해 넘겨 끝낸 대화는 시작한 날 몫으로 쌓여, 오늘과 맞춰 보면 받은 금액이 빠진다.
 *
 * @param receipt 완료 응답의 영수증. 환급과 상관없는 완료면 없다
 * @returns 이번 완료로 붙은 금액이 없으면(같은 날 두 번째 대화, 미확정) null
 */
export const completionEarnOf = (
  receipt: RewardCompletion | undefined,
): CompletionEarn | null =>
  receipt?.status === 'EARNED' && receipt.earnedWon && receipt.earnedWon > 0
    ? { earnedWon: receipt.earnedWon }
    : null;
