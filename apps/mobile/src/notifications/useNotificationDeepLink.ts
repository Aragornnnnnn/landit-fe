// 알림 탭 딥링크 훅 — 콜드 스타트 경로(WebView 초기 URI용)와 웜 상태 탭 콜백을 제공한다
import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';

import { extractNotificationPath } from './deep-link';

// loading: 콜드 스타트 조회 전이라 WebView 마운트를 보류, ready: 경로 확정 (null이면 알림으로 진입한 게 아니다)
export type ColdStartState =
  { status: 'loading' } | { status: 'ready'; path: string | null };

export const useNotificationDeepLink = (
  onWarmTap: (path: string) => void,
): ColdStartState => {
  const [coldStart, setColdStart] = useState<ColdStartState>({
    status: 'loading',
  });
  // 콜드 스타트로 이미 소비한 알림 id — 같은 탭이 웜 리스너로도 들어오는 플랫폼이 있어 중복 이동을 막는다
  const consumedIdRef = useRef<string | null>(null);
  // 웜 콜백은 렌더마다 새로 만들어져도 구독은 유지한 채 최신 것을 부른다
  const onWarmTapRef = useRef(onWarmTap);

  useEffect(() => {
    onWarmTapRef.current = onWarmTap;
  });

  useEffect(() => {
    let cancelled = false;

    // 콜드 스타트 — 앱을 실행시킨 알림이 있으면 그 경로를 초기 URI로 쓴다
    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (cancelled) return;

        consumedIdRef.current =
          response?.notification.request.identifier ?? null;
        setColdStart({
          status: 'ready',
          path: response
            ? extractNotificationPath(
                response.notification.request.content.data,
              )
            : null,
        });

        // 소비한 응답은 지운다 — 안 지우면 알림과 무관한 다음 콜드 스타트에서도 남아 있어 또 딥링크된다
        if (response) void Notifications.clearLastNotificationResponseAsync();
      })
      // 조회가 실패해도 "알림 진입 아님"으로 열어준다 — ready가 안 오면 WebView가 영영 마운트되지 않는다
      .catch(() => {
        if (!cancelled) setColdStart({ status: 'ready', path: null });
      });

    // 웜 — 앱이 떠 있는 상태의 알림 탭. 콜백(브릿지)으로 웹에 이동을 맡긴다
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { identifier } = response.notification.request;
        if (identifier === consumedIdRef.current) return;

        const path = extractNotificationPath(
          response.notification.request.content.data,
        );
        if (path) onWarmTapRef.current(path);
      },
    );

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return coldStart;
};
