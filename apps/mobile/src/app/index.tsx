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
import * as SplashScreen from 'expo-splash-screen';
import WebView from 'react-native-webview';

import { generateNonce } from '@/auth/nonce';
import { requestSocialIdToken, SocialLoginError } from '@/auth/socialLogin';
import { useNativeBridge } from '@/bridge/useNativeBridge';
import { WEB_URL } from '@/config/webUrl';

// 네이티브 스플래시를 웹 첫 페인트까지 붙잡아 둔다 — 자동 숨김을 막고 WebView onLoad에서 수동으로 감춘다
void SplashScreen.preventAutoHideAsync();

const ShellScreen = () => {
  const webviewRef = useRef<WebView>(null);
  const [isWebReady, setIsWebReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  // 재시도 시 WebView를 새로 마운트하기 위한 key
  const [loadAttempt, setLoadAttempt] = useState(0);

  const { onMessage, postToWeb } = useNativeBridge(webviewRef, {
    EXIT_APP: () => BackHandler.exitApp(),
    // 웹의 로그인 요청을 받아 provider SDK로 idToken을 발급받고, nonce와 함께 웹으로 돌려준다
    SOCIAL_LOGIN_REQUEST: async ({ provider }) => {
      try {
        const nonce = generateNonce();
        const idToken = await requestSocialIdToken(provider, nonce);
        postToWeb({ type: 'SOCIAL_LOGIN_SUCCESS', provider, idToken, nonce });
      } catch (error) {
        const message =
          error instanceof SocialLoginError
            ? error.message
            : '로그인 중 문제가 생겼어요.';
        const cancelled = error instanceof SocialLoginError && error.cancelled;
        postToWeb({ type: 'SOCIAL_LOGIN_ERROR', message, cancelled });
      }
    },
  });

  // 웹 첫 페인트(onLoad)나 로드 실패로 화면이 바뀌면 스플래시를 감춘다 — 그 전까지 네이티브 스플래시가 흰 로딩 화면을 가려 준다
  useEffect(() => {
    if (isWebReady || loadFailed) {
      void SplashScreen.hideAsync();
    }
  }, [isWebReady, loadFailed]);

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
    // WebView가 아예 마운트되지 않는 경로라 isWebReady/loadFailed가 바뀔 일이 없다
    void SplashScreen.hideAsync();
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
      // 앱 진입점은 로그인 화면 — 인증 붙기 전까지 루트 대신 /login을 바로 로드한다
      source={{ uri: `${WEB_URL}/login` }}
      onMessage={onMessage}
      onLoad={() => setIsWebReady(true)}
      onError={() => setLoadFailed(true)}
      // onError는 네트워크 자체가 안 될 때만 잡는다. 서버가 4xx/5xx로 응답한 경우는
      // onHttpError가 따로 잡아야 한다 — 없으면 에러 화면 대신 날것의 에러 페이지가 보인다
      onHttpError={() => setLoadFailed(true)}
      startInLoadingState
      renderLoading={() => (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <ActivityIndicator />
        </View>
      )}
      // iOS는 시스템 뒤로가기 버튼이 없다 — 화면 끝 스와이프로 WebView 히스토리를 직접 탐색하게 한다
      allowsBackForwardNavigationGestures
      style={styles.webview}
    />
  );
};

export default ShellScreen;

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
