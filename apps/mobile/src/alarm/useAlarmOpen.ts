// 알람으로 앱이 열렸을 때 — 울림을 끄고, "대화하러 가기"로 열렸으면 그 알람이 갈 화면을 알려 준다 (알림·위젯 딥링크 훅과 같은 모양)
import { useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import type { AlarmType } from '@landit/bridge';

import { reportWarning } from '@/monitoring/report';

import { alarmEntryOf } from './alarm';
import { alarmIdFromLink } from './alarm-link';
import {
  onAlarmButtonPressed,
  stopRingingIfOpenedByAlarm,
} from './stop-ringing';

type AlarmEntry = { alarmType: AlarmType; path: string };

// loading: 콜드 스타트 조회 전이라 WebView 마운트를 보류, ready: 첫 주소 확정 (null이면 알람 버튼으로 연 게 아니다)
export type AlarmColdStart =
  { status: 'loading' } | { status: 'ready'; path: string | null };

// 앱을 연 URL은 프로세스가 사는 동안 같은 값을 계속 돌려준다 — 셸이 다시 마운트돼도 한 번만 쓴다
let coldStartConsumed = false;

const entryOf = async (alarmId: string | null) =>
  alarmId ? alarmEntryOf(alarmId) : null;

// 콜드 스타트는 첫 주소로 연다(웹이 아직 없어 메시지를 못 받는다).
// 앱이 떠 있을 땐 onWarmOpen으로 알리기만 한다 — 대화·표현학습 중이면 그대로 둘지는 지금 화면을 아는 웹이 정한다
export const useAlarmOpen = (
  onWarmOpen: (entry: AlarmEntry) => void,
): AlarmColdStart => {
  const [coldStart, setColdStart] = useState<AlarmColdStart>(() =>
    coldStartConsumed ? { status: 'ready', path: null } : { status: 'loading' },
  );
  // 콜백은 렌더마다 새로 만들어져도 구독은 유지한 채 최신 것을 부른다
  const onWarmOpenRef = useRef(onWarmOpen);

  useEffect(() => {
    onWarmOpenRef.current = onWarmOpen;
  });

  useEffect(() => {
    let cancelled = false;

    // 울림을 끄고, iOS 버튼으로 열렸으면 그 알람 id를 돌려준다.
    // 앱 복귀와 iOS 버튼 이벤트가 겹쳐 오면 같은 기록을 두 번 읽어 두 번 알리니 차례로 처리한다
    let queue: Promise<unknown> = Promise.resolve();
    const stopRinging = () => {
      const run = queue.then(stopRingingIfOpenedByAlarm);
      queue = run.catch(() => undefined);
      return run;
    };
    const openWarm = (alarmId: Promise<string | null> | string | null) =>
      void Promise.resolve(alarmId)
        .then(entryOf)
        .then((entry) => {
          if (entry && !cancelled) onWarmOpenRef.current(entry);
        })
        .catch(reportWarning);

    // 콜드 스타트 — iOS는 버튼 기록으로, Android는 앱을 연 알람 링크로 어느 알람인지 안다
    if (!coldStartConsumed) {
      Promise.all([stopRinging(), Linking.getInitialURL()])
        .then(([pressedId, url]) => entryOf(pressedId ?? alarmIdFromLink(url)))
        .then((entry) => {
          // 다시 마운트되며 버려진 조회면 표시하지 않는다 — 새 조회가 다시 확인한다
          if (cancelled) return;
          coldStartConsumed = true;
          setColdStart({ status: 'ready', path: entry?.path ?? null });
        })
        // 조회가 실패해도 "알람 진입 아님"으로 열어준다 — ready가 안 오면 WebView가 영영 마운트되지 않는다
        .catch((error) => {
          reportWarning(error);
          if (!cancelled) setColdStart({ status: 'ready', path: null });
        });
    }

    // 웜 — 앱으로 돌아왔거나 iOS 버튼 이벤트가 왔다
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') openWarm(stopRinging());
    });
    const button = onAlarmButtonPressed(() => openWarm(stopRinging()));
    // 웜 — Android 버튼은 알람 링크로 연다. 앱이 맨 앞이어도 링크는 도착한다
    const link = Linking.addEventListener('url', ({ url }) => {
      const alarmId = alarmIdFromLink(url);
      if (!alarmId) return;
      void stopRinging().catch(reportWarning);
      openWarm(alarmId);
    });

    return () => {
      cancelled = true;
      appState.remove();
      button.remove();
      link.remove();
    };
  }, []);

  return coldStart;
};
