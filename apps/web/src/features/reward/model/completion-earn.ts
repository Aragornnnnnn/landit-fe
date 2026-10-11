// 대화를 끝낸 순간 받은 금액을 보여 줄지 정하는 규칙 — 완료 응답에는 금액이 실려 오지 않아, 완료 전에 적어 둔 것과 새로 받은 환급을 맞춰 본다
import type { RewardActivity, RewardView } from '../api/reward';
import { earnedGuideOf, todaySlotsOf, type TodaySlot } from './reward-status';

// 끝내면 축하 화면이 뜨는 활동 — 표현은 하나마다 알림으로 따로 알린다
export type ConversationActivity = Exclude<
  RewardActivity['activityType'],
  'EXPRESSION'
>;

// 대화를 끝내기 직전, 그 대화가 오늘 아직이었다는 표시. 이게 있어야 이번 완료로 금액이 새로 붙은 것이다
export interface EarnBase {
  // KST 날짜 (yyyy-MM-dd)
  date: string;
  activityType: ConversationActivity;
}

// 오늘 같은 종류를 이미 끝냈거나 쌓는 중이 아니면 null — 이번 완료로는 받을 것이 없다
export const earnBaseOf = (
  view: RewardView,
  activityType: ConversationActivity,
): EarnBase | null => {
  const activity = view.today?.activities.find(
    (item) => item.activityType === activityType,
  );
  return view.today && activity && !activity.completed
    ? { date: view.today.date, activityType }
    : null;
};

export interface CompletionEarn {
  // 방금 끝낸 대화 — 그 칸이 이 순간에 찬다
  activityType: ConversationActivity;
  earnedWon: number;
  // 오늘 더 받을 수 있는 금액을 말하는 한 줄
  guide: string;
  slots: TodaySlot[];
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
  // 적어 둘 때 0원이었으니, 지금 받은 금액이 곧 이번 완료의 몫이다
  const earnedWon =
    view.today.activities.find(
      (item) => item.activityType === base.activityType,
    )?.earnedWon ?? 0;
  if (earnedWon <= 0) return null;

  return {
    activityType: base.activityType,
    earnedWon,
    guide: earnedGuideOf(view.today),
    slots: todaySlotsOf(view.today.activities),
  };
};
