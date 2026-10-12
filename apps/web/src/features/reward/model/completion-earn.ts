// 시나리오 대화를 끝낸 순간 받은 금액을 보여 줄지 정하는 규칙 — 완료 응답을 기다리지 않고, 완료 전에 적어 둔 것과 새로 받은 환급을 맞춰 본다
import type { RewardView } from '../api/reward';

// 대화를 끝내기 직전, 오늘 몫이 아직이었다는 표시. 이게 있어야 이번 완료로 금액이 새로 붙은 것이다
export interface EarnBase {
  // KST 날짜 (yyyy-MM-dd)
  date: string;
}

// 오늘 몫을 이미 받았거나 쌓는 중이 아니면 null — 이번 완료로는 받을 것이 없다
export const earnBaseOf = (view: RewardView): EarnBase | null =>
  view.today && view.today.earnedWon === 0 ? { date: view.today.date } : null;

export interface CompletionEarn {
  earnedWon: number;
}

/**
 * @param view 지금 받아 둔 환급. 환급과 상관없으면 null
 * @param base 완료 직전에 적어 둔 것. 없으면 null
 * @returns 보여 줄 것이 없으면(새 금액이 아직 안 왔거나 날이 바뀌었다) null
 */
export const completionEarnOf = (
  view: RewardView | null,
  base: EarnBase | null,
): CompletionEarn | null => {
  if (!view?.today || base === null || view.today.date !== base.date)
    return null;
  // 적어 둘 때 0원이었으니, 오늘 받은 금액이 곧 이번 완료의 몫이다
  return view.today.earnedWon > 0 ? { earnedWon: view.today.earnedWon } : null;
};
