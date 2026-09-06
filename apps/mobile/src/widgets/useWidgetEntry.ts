// 위젯 탭 진입 훅 — 콜드 스타트 경로(WebView 초기 URI용)와 웜 상태 탭 콜백을 제공한다 (알림 딥링크 훅과 같은 모양)
import { useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';

import { widgetEntryPath } from './widget-link';

// loading: 콜드 스타트 조회 전이라 WebView 마운트를 보류, ready: 경로 확정 (null이면 위젯으로 들어온 게 아니다)
export type WidgetEntryState =
  { status: 'loading' } | { status: 'ready'; path: string | null };

// 앱을 연 URL은 프로세스가 사는 동안 같은 값을 계속 돌려준다 — 셸이 다시 마운트돼도(로드 실패 재시도) 한 번만 쓴다
let initialUrlConsumed = false;

export const useWidgetEntry = (
  onWarmTap: (path: string) => void,
): WidgetEntryState => {
  // 이미 소비했으면 조회 없이 바로 연다
  const [coldStart, setColdStart] = useState<WidgetEntryState>(() =>
    initialUrlConsumed
      ? { status: 'ready', path: null }
      : { status: 'loading' },
  );
  // 웜 콜백은 렌더마다 새로 만들어져도 구독은 유지한 채 최신 것을 부른다
  const onWarmTapRef = useRef(onWarmTap);

  useEffect(() => {
    onWarmTapRef.current = onWarmTap;
  });

  useEffect(() => {
    let cancelled = false;

    // 콜드 스타트 — 앱을 실행시킨 URL이 위젯 탭이면 그 경로를 초기 URI로 쓴다
    if (!initialUrlConsumed) {
      Linking.getInitialURL()
        .then((url) => {
          if (cancelled) return;
          initialUrlConsumed = true;
          setColdStart({ status: 'ready', path: widgetEntryPath(url) });
        })
        // 조회가 실패해도 "위젯 진입 아님"으로 열어준다 — ready가 안 오면 WebView가 영영 마운트되지 않는다
        .catch(() => {
          if (!cancelled) setColdStart({ status: 'ready', path: null });
        });
    }

    // 웜 — 앱이 떠 있는 상태의 위젯 탭. 콜백(브릿지)으로 웹에 이동을 맡긴다
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const path = widgetEntryPath(url);
      if (path) onWarmTapRef.current(path);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return coldStart;
};
