// iOS ATT 결과를 이번 실행 동안 들고 있다가 웹이 물으면 답하는 보관소 — 앰플리튜드 허용률 계측용
import type { NativeToWebMessage } from '@landit/bridge';

export type TrackingStatus = Omit<
  Extract<NativeToWebMessage, { type: 'TRACKING_STATUS' }>,
  'type'
>;

export const createTrackingStatus = () => {
  let resolveOutcome: (outcome: TrackingStatus | null) => void = () => {};
  const outcome = new Promise<TrackingStatus | null>((resolve) => {
    resolveOutcome = resolve;
  });
  let promptReported = false;

  return {
    // ATT 요청이 끝나면 부른다 — Android·실패는 null. 두 번째 호출부터는 무시된다(Promise는 한 번만 정해진다)
    settle: (status: TrackingStatus | null) => resolveOutcome(status),
    // 웹은 사용자가 권한창에 답하기 전에 뜨므로, 답이 날 때까지 기다렸다 돌려준다
    read: async () => {
      const status = await outcome;
      if (!status) return null;
      // 웹이 다시 물어도(새로고침 등) 결정 이벤트가 두 번 찍히지 않게 권한창 사실은 한 번만 알린다
      const prompted = status.prompted && !promptReported;
      if (prompted) promptReported = true;
      return { status: status.status, prompted };
    },
  };
};

// 앱 전체가 공유하는 하나 — initMetaSdk가 채우고 브릿지 핸들러가 읽는다
export const trackingStatus = createTrackingStatus();
