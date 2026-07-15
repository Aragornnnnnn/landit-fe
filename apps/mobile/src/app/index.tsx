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
import { runHaptic } from '@/bridge/haptics';
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
    // 웹이 인터랙션 시점에 보낸 진동 요청을 expo-haptics로 실행한다
    HAPTIC: ({ pattern }) => void runHaptic(pattern),
    // 웹의 로그인 요청을 받아 provider SDK로 idToken을 발급받고, nonce와 함께 웹으로 돌려준다
    SOCIAL_LOGIN_REQUEST: async ({ provider }) => {
      try {
        const nonce = generateNonce();
        const { idToken, nickname } = await requestSocialIdToken(
          provider,
          nonce,
        );
        postToWeb({
          type: 'SOCIAL_LOGIN_SUCCESS',
          provider,
          idToken,
          nonce,
          nickname,
        });
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
      // 앱 진입점은 루트 — 로그인 여부는 웹의 인증 가드가 판단해 로그인/홈으로 보낸다
      source={{ uri: `${WEB_URL}/` }}
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
      // 웹 getUserMedia(STT 마이크) 요청을 OS 권한만으로 허용 — iOS에서 앱·웹뷰 이중 권한 팝업 방지
      mediaCapturePermissionGrantType="grant"
      // AI 발화(TTS)를 사용자 제스처 없이도 재생 — iOS 기본은 자동재생을 막아 2번째 발화부터 무음이 된다
      mediaPlaybackRequiresUserAction={false}
      allowsInlineMediaPlayback
      // 오버스크롤(iOS 바운스·Android 글로우)과 줌 차단 — 앱스러운 동작
      bounces={false}
      overScrollMode="never"
      setBuiltInZoomControls={false}
      // dev 빌드에서만 원격 디버깅 (Safari/Chrome 인스펙터)
      webviewDebuggingEnabled={__DEV__}
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
