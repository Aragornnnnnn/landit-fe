// 첫 시나리오 완료를 메타에 계정마다 한 번 알린다 — 메타 광고가 첫 대화를 끝낼 사람을 찾아 보여 주게
import type { QueryClient } from '@tanstack/react-query';

// 첫 완료인지는 구독 응답의 완료 이력으로 가린다 — 그 값을 내려 주는 곳이 구독 조회뿐이라 가로 import를 둔다
import type { MySubscription } from '@/features/subscription/api/subscription';
import { subscriptionKeys } from '@/features/subscription/model/my-subscription/keys';
import { sendAdEventOnce } from '@/shared/analytics';
import { getCurrentUserId } from '@/shared/auth/auth-store';

// 받아 둔 구독 응답으로 이미 끝내 본 사람인지 본다 — 받은 적 없으면 모르는 것이라 처음으로 친다(온보딩에서 바로 온 신규 가입자)
export const hasCompletedScenarioBefore = (queryClient: QueryClient) => {
  const userId = getCurrentUserId();
  if (userId === null) return false;
  const subscription = queryClient.getQueryData<MySubscription>(
    subscriptionKeys.mine(userId),
  );
  return subscription?.conversationCompletedSinceLaunch === true;
};

// 완료 이력은 제출 전에 읽어 넘긴다 — 제출 중에 구독이 새로 받아지면 방금 끝낸 것까지 이력에 들어 있다
export const notifyFirstScenarioCompleted = (completedBefore: boolean) => {
  const userId = getCurrentUserId();
  if (userId === null || completedBefore) return;
  sendAdEventOnce('first_scenario_talk_completed', userId);
};
