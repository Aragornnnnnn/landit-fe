// WebView 셸 — web 앱을 띄우고 postMessage 브릿지로 통신한다. 실제 제품 UI는 전부 web에 있다
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import WebView from 'react-native-webview';

import { initMetaSdk } from '@/analytics/meta';
import { generateNonce } from '@/auth/nonce';
import { requestSocialIdToken, SocialLoginError } from '@/auth/socialLogin';
import { runHaptic } from '@/bridge/haptics';
import { nativeContextScript } from '@/bridge/nativeContext';
import { useNativeBridge } from '@/bridge/useNativeBridge';
import { WEB_URL } from '@/config/webUrl';
import { isExternalNavigation } from '@/navigation/isExternalNavigation';
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '@/notifications/permission';
import { getExpoPushToken } from '@/notifications/push-token';
import { syncReminders } from '@/notifications/reminders';
import { initializeNotifications } from '@/notifications/setup';
import { useNotificationDeepLink } from '@/notifications/useNotificationDeepLink';
import { syncStreakWidget, syncWidgetOnLaunch } from '@/widgets/sync';
import { saveWidgetData } from '@/widgets/widget-store';

// 네이티브 스플래시를 웹 첫 페인트까지 붙잡아 둔다 — 자동 숨김을 막고 WebView onLoad에서 수동으로 감춘다
void SplashScreen.preventAutoHideAsync();

const ShellScreen = () => {
  // 위젯 타임라인 되살리기 — 로그인 전에도 0일 시간표가 돌게 한다
  useEffect(() => {
    void syncWidgetOnLaunch();
  }, []);

  const webviewRef = useRef<WebView>(null);
  const [isWebReady, setIsWebReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  // 재시도 시 WebView를 새로 마운트하기 위한 key
  const [loadAttempt, setLoadAttempt] = useState(0);

  // 푸시 토큰은 권한이 허용된 뒤에만 발급된다 — 실패하면 건너뛰고 다음 실행에서 다시 시도한다
  const sendPushToken = async () => {
    const token = await getExpoPushToken();
    if (token) postToWeb({ type: 'PUSH_TOKEN', token });
  };

  const { onMessage, postToWeb } = useNativeBridge(webviewRef, {
    EXIT_APP: () => BackHandler.exitApp(),
    // 웹이 인터랙션 시점에 보낸 진동 요청을 expo-haptics로 실행한다
    HAPTIC: ({ pattern }) => void runHaptic(pattern),
    // 마이크 권한이 차단된 상태 — OS 앱 설정 화면을 연다 (iOS·Android 공통)
    OPEN_SETTINGS: () => void Linking.openSettings(),
    // 웹이 만든 예약 목록대로 로컬 알림을 통째로 다시 깐다 (증분 갱신이 아니다)
    SYNC_REMINDERS: ({ reminders }) => void syncReminders(reminders),
    // 홈 위젯 데이터를 기록하고 iOS 위젯 타임라인을 새로 예약한다.
    // 저장을 먼저 끝낸다 — 저장이 실패하면 다음 실행이 낡은 데이터로 위젯을 되돌려 놓는다
    SYNC_WIDGET_DATA: async ({ data }) => {
      await saveWidgetData(data);
      syncStreakWidget(data);
    },
    // 알림 권한 상태 조회 — 다이얼로그 없이 현재 상태만 회신한다
    GET_NOTIFICATION_PERMISSION: async () => {
      const status = await getNotificationPermission();
      postToWeb({ type: 'NOTIFICATION_PERMISSION', status });
      if (status === 'granted') await sendPushToken();
    },
    // 알림 권한 능동 요청 — OS 권한창을 띄울 수 있고, 결과를 회신한다
    REQUEST_NOTIFICATION_PERMISSION: async () => {
      const status = await requestNotificationPermission();
      postToWeb({ type: 'NOTIFICATION_PERMISSION', status });
      if (status === 'granted') await sendPushToken();
    },
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

  // 알림 탭 딥링크 — 콜드 스타트는 초기 URI로, 웜 상태 탭은 NAVIGATE 브릿지로 웹 라우터에 위임한다
  const coldStart = useNotificationDeepLink((path) =>
    postToWeb({ type: 'NAVIGATE', url: path }),
  );

  // Meta SDK 초기화와 iOS ATT 동의 요청 — 앱 첫 진입에 1회 (광고 설치 어트리뷰션)
  useEffect(() => {
    void initMetaSdk();
  }, []);

  // 알림 표시 정책·Android 채널 등록 — 권한 요청은 웹이 브릿지로 시점을 정한다
  useEffect(() => {
    void initializeNotifications();
  }, []);

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
    // 로드 실패 — 우는 랜디와 원인 안내로 다독이고 재시도를 유도한다 (텅 빈 흰 화면 금지)
    return (
      <View style={styles.errorScreen}>
        <Image
          source={require('../../assets/images/landy-crying.webp')}
          style={styles.errorCharacter}
        />
        <Text style={styles.errorTitle}>화면을 불러오지 못했어요</Text>
        <Text style={styles.errorDescription}>
          네트워크 연결을 확인하고{'\n'}다시 시도해 주세요
        </Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => {
            setLoadFailed(false);
            setIsWebReady(false);
            setLoadAttempt((attempt) => attempt + 1);
          }}
        >
          <Text style={styles.retryLabel}>다시 시도할게요</Text>
        </Pressable>
      </View>
    );
  }

  // 콜드 스타트 조회가 끝나야 초기 URI가 정해진다 — 그때까지 마운트 보류 (수 ms, 스플래시가 가린다)
  if (coldStart.status === 'loading') {
    return null;
  }

  return (
    <WebView
      key={loadAttempt}
      ref={webviewRef}
      // 진입점은 루트, 알림 콜드 스타트면 페이로드의 경로 — 로그인 여부는 웹의 인증 가드가 판단한다
      source={{ uri: `${WEB_URL}${coldStart.path ?? '/'}` }}
      // 콘텐츠 로드 전 네이티브 컨텍스트(플랫폼·앱 버전)를 window에 주입 — 웹 계측이 첫 렌더에서 바로 읽는다
      injectedJavaScriptBeforeContentLoaded={nativeContextScript}
      onMessage={onMessage}
      // 웹 도메인 밖으로 나가는 이동(스토어 등)은 WebView 대신 OS가 연다 —
      // 스토어가 웹뷰 안에서 로그인 페이지로 열리는 문제 방지
      onShouldStartLoadWithRequest={(request) => {
        if (request.isTopFrame === false) return true;
        if (!isExternalNavigation(request.url, WEB_URL)) return true;
        void Linking.openURL(request.url);
        return false;
      }}
      onLoad={() => setIsWebReady(true)}
      onError={() => setLoadFailed(true)}
      // onError는 네트워크 자체가 안 될 때만 잡는다. 서버가 4xx/5xx로 응답한 경우는
      // onHttpError가 따로 잡아야 한다 — 없으면 에러 화면 대신 날것의 에러 페이지가 보인다
      onHttpError={() => setLoadFailed(true)}
      startInLoadingState
      // 로딩 화면 배경을 스플래시와 같은 색으로 — 흰 네이티브 로딩창이 번쩍이지 않고 스플래시에서 매끄럽게 이어진다
      renderLoading={() => (
        <View style={[StyleSheet.absoluteFill, styles.loading]}>
          <ActivityIndicator color="#ffffff" />
        </View>
      )}
      // iOS 엣지 스와이프의 WebView 히스토리 직접 탐색은 막는다 — 웹의 뒤로가기 정책(replace·이중탭 종료)을
      // 우회해 지난 대화/퀴즈 화면이 그대로 다시 나오기 때문. 화면 이동은 앱 안의 버튼으로만 한다
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
    // 웹 첫 페인트 전 WebView 기본 흰 배경 대신 스플래시 색을 깔아, 로드 중 흰 번쩍임을 막는다
    backgroundColor: '#e07a3a',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e07a3a',
  },
  // 로드 실패 화면 — 웹 앱 배경(gray-50)·타이포 톤에 맞춘다
  errorScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbfbfa',
    paddingHorizontal: 32,
  },
  errorCharacter: {
    width: 132,
    height: 132,
    resizeMode: 'contain',
  },
  errorTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  errorDescription: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: '#8a8a86',
  },
  retryButton: {
    marginTop: 24,
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#e07a3a',
    paddingVertical: 15,
  },
  retryLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
