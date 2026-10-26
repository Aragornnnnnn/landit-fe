// 첫 시나리오 완료를 광고 이벤트로 한 사람에게 한 번만 알린다 — 메타 광고가 첫 대화를 끝낼 사람을 찾아 보여 주게
import { sendAdEvent } from '@/shared/analytics';
import { seenFlag, type SeenFlag } from '@/shared/lib/seen-flag';

// 계정마다 보냈는가를 기기에 남긴다 — 같은 폰에서 계정을 바꾸거나 탈퇴 후 다시 가입해도 그 계정의 첫 완료는 간다
const flags = new Map<number, SeenFlag>();
const reportedFlag = (userId: number) => {
  const flag =
    flags.get(userId) ??
    seenFlag(`landit-ad-first-scenario-completed:${userId}`);
  flags.set(userId, flag);
  return flag;
};

// 저장소를 못 쓰는 기기에서도 이번 실행 안에서는 두 번 보내지 않는다
const reportedInSession = new Set<number>();

/**
 * 시나리오를 끝냈을 때 부른다. 그 계정의 처음이면 첫 시나리오 완료를 보낸다.
 *
 * @param completedBefore 서버가 이미 끝내 본 적 있다고 한 사람인가 — 이 기기에서 처음이어도 첫 완료가 아니다
 */
export const reportFirstScenarioCompleted = (
  userId: number,
  completedBefore: boolean,
) => {
  if (completedBefore || reportedInSession.has(userId)) return;
  const flag = reportedFlag(userId);
  if (flag.has()) return;
  if (!sendAdEvent('first_scenario_completed')) return;
  reportedInSession.add(userId);
  flag.mark();
};
