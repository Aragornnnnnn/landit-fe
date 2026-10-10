// 앱이 열리거나 돌아올 때 알람 정리 — 울림 끄기, "대화하러 가기"로 열렸으면 갈 화면 알리기, 지난 건너뛰기 되돌리기
import { useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import type { AlarmType } from '@landit/bridge';

import { reportWarning } from '@/monitoring/report';

import { alarmEntryOf, restoreSkippedDay } from './alarm';
import { alarmEntryFromLink } from './alarm-link';
import {
  onAlarmButtonPressed,
  stopRingingIfOpenedByAlarm,
} from './stop-ringing';

type AlarmEntry = { alarmType: AlarmType; path: string };

// loading: 첫 주소를 정하는 중이라 WebView를 띄우지 않는다. ready: path가 null이면 알람 버튼으로 연 게 아니다
export type AlarmEntryState =
  { status: 'loading' } | { status: 'ready'; path: string | null };

// 울림 끄기 → (iOS 버튼이면) 갈 화면 찾기 → 지난 건너뛰기 되돌리기, 이 순서를 지킨다.
// 되돌리기는 알람을 다시 걸어 id가 바뀌므로 id로 찾는 일을 먼저 끝낸다
export const tidyUpOnOpen = async (): Promise<AlarmEntry | null> => {
  try {
    const pressedId = await stopRingingIfOpenedByAlarm();
    return pressedId ? await alarmEntryOf(pressedId) : null;
  } finally {
    await restoreSkippedDay().catch(reportWarning);
  }
};

// 앱을 연 링크는 앱이 꺼질 때까지 같은 값으로 남는다 — 화면이 다시 마운트돼도 한 번만 쓴다
let coldStartConsumed = false;

// 앱이 꺼져 있었으면 첫 주소를 갈 화면으로 연다 — 아직 웹이 없어 메시지를 못 받는다.
// 앱이 떠 있었으면 onWarmOpen으로 알리기만 한다 — 학습 중이면 그대로 둘지는 웹이 정한다
export const useAlarmOpen = (
  onWarmOpen: (entry: AlarmEntry) => void,
): AlarmEntryState => {
  const [entryState, setEntryState] = useState<AlarmEntryState>(() =>
    coldStartConsumed ? { status: 'ready', path: null } : { status: 'loading' },
  );
  // 콜백이 렌더마다 바뀌어도 구독은 그대로 두고 최신 콜백을 부른다
  const onWarmOpenRef = useRef(onWarmOpen);

  useEffect(() => {
    onWarmOpenRef.current = onWarmOpen;
  });

  useEffect(() => {
    let cancelled = false;

    // 앱 복귀와 버튼 이벤트가 겹쳐 오면 같은 기록을 두 번 읽으니 차례로 처리한다
    let queue: Promise<unknown> = Promise.resolve();
    const tidyUp = () => {
      const run = queue.then(tidyUpOnOpen);
      queue = run.catch(() => undefined);
      return run;
    };
    const openWarm = (entry: AlarmEntry | null) => {
      if (entry && !cancelled) onWarmOpenRef.current(entry);
    };

    // 앱이 꺼져 있었을 때 — Android는 링크에 갈 화면이 있고, iOS는 버튼 기록으로 찾는다
    if (!coldStartConsumed) {
      Promise.all([tidyUp(), Linking.getInitialURL()])
        .then(([pressed, url]) => {
          // 다시 마운트돼 버려진 조회면 무시한다 — 새 조회가 다시 한다
          if (cancelled) return;
          coldStartConsumed = true;
          const entry = alarmEntryFromLink(url) ?? pressed;
          setEntryState({ status: 'ready', path: entry?.path ?? null });
        })
        // 실패해도 첫 화면으로 연다 — ready가 안 오면 WebView가 영영 안 뜬다
        .catch((error) => {
          reportWarning(error);
          if (!cancelled) setEntryState({ status: 'ready', path: null });
        });
    }

    // 앱이 떠 있었을 때 — 앱으로 돌아왔거나 iOS 버튼 이벤트가 왔다
    const warm = () => {
      tidyUp().then(openWarm).catch(reportWarning);
    };
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') warm();
    });
    const button = onAlarmButtonPressed(warm);
    // 앱이 떠 있었을 때 — Android 버튼은 링크로 연다. 맨 앞이어도 링크가 오고, 갈 화면은 링크에 있다
    const link = Linking.addEventListener('url', ({ url }) => {
      const entry = alarmEntryFromLink(url);
      if (!entry) return;
      tidyUp().catch(reportWarning);
      openWarm(entry);
    });

    return () => {
      cancelled = true;
      appState.remove();
      button.remove();
      link.remove();
    };
  }, []);

  return entryState;
};
