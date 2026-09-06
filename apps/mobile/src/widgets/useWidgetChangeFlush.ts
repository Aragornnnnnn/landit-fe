// 쌓인 위젯 추가·삭제를 웹으로 흘려보내는 훅 — 웹이 청할 때, 앱이 살아 있는 동안 새로 기록될 때, 포그라운드로 돌아올 때
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type { NativeToWebMessage } from '@landit/bridge';

import {
  drainWidgetChanges,
  subscribeWidgetChanges,
} from './model/widget-changes';

export const useWidgetChangeFlush = (
  postToWeb: (message: NativeToWebMessage) => void,
  isWebReady: boolean,
) => {
  // postToWeb은 렌더마다 새로 만들어진다 — 구독은 한 번만 걸고 최신 것을 부른다
  const postToWebRef = useRef(postToWeb);
  useEffect(() => {
    postToWebRef.current = postToWeb;
  });

  const flush = async () => {
    for (const record of await drainWidgetChanges()) {
      postToWebRef.current({ type: 'WIDGET_CHANGED', ...record });
    }
  };

  useEffect(() => {
    // 웹이 준비되기 전에 비우면 받을 사람이 없어 유실된다 — 그때까진 쌓아 둔다 (웹이 뜨면 REQUEST_WIDGET_CHANGES로 청한다)
    if (!isWebReady) return;

    const unsubscribe = subscribeWidgetChanges(() => void flush());
    // 위젯은 런처(홈 화면)에서 놓으므로 앱은 그동안 뒤에 가 있다 — 돌아오는 순간 비운다
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void flush();
    });
    return () => {
      unsubscribe();
      appState.remove();
    };
  }, [isWebReady]);

  return flush;
};
