// WebView 셸 — web 앱을 띄우고 postMessage 브릿지로 통신한다. 실제 제품 UI는 전부 web에 있다
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import WebView from 'react-native-webview';

import { useNativeBridge } from '@/bridge/useNativeBridge';
import { WEB_URL } from '@/config/webUrl';

export default function ShellScreen() {
  const webviewRef = useRef<WebView>(null);
  const [isWebReady, setIsWebReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  // 재시도 시 WebView를 새로 마운트하기 위한 key
  const [loadAttempt, setLoadAttempt] = useState(0);

  const { onMessage, postToWeb } = useNativeBridge(webviewRef, {
    EXIT_APP: () => BackHandler.exitApp(),
  });

  // 웹이 로드 완료됐을 때만 Android 뒤로가기를 위임한다 — 그 전엔 위임해도 웹이 응답 못 해 영구 먹통이 된다
  useEffect(() => {
    if (!isWebReady || loadFailed) return;

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        postToWeb({ type: 'BACK_PRESSED' });
        return true;
      },
    );
    return () => subscription.remove();
    // postToWeb은 매 렌더 새로 만들어지지만, 재구독돼도 BackHandler 등록은 무해하다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWebReady, loadFailed]);

  if (!WEB_URL) {
    return (
      <View style={styles.center}>
        <Text>EXPO_PUBLIC_WEB_URL이 설정되지 않았어요.</Text>
      </View>
    );
  }

  if (loadFailed) {
    return (
      <View style={styles.center}>
        <Text>화면을 불러오지 못했어요.</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => {
            setLoadFailed(false);
            setIsWebReady(false);
            setLoadAttempt((attempt) => attempt + 1);
          }}
        >
          <Text style={styles.retryLabel}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <WebView
      key={loadAttempt}
      ref={webviewRef}
      source={{ uri: WEB_URL }}
      onMessage={onMessage}
      onLoad={() => setIsWebReady(true)}
      onError={() => setLoadFailed(true)}
      onHttpError={() => setLoadFailed(true)}
      startInLoadingState
      renderLoading={() => (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <ActivityIndicator />
        </View>
      )}
      allowsBackForwardNavigationGestures
      style={styles.webview}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  retryButton: {
    borderRadius: 12,
    backgroundColor: '#e07a3a',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryLabel: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
