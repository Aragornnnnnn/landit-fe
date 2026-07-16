import Constants from 'expo-constants';

// 1순위 EXPO_PUBLIC_WEB_URL — 배포/터널 등 명시 지정
// 2순위 (dev) Expo dev 서버와 같은 머신의 3000 포트 — 실기기에서도 localhost 문제 없이 동작
// 3순위 없음 — 프로덕션인데 설정을 안 한 경우, null (화면에서 에러 문구로 처리)
function resolveWebUrl(): string | null {
  const envUrl = process.env.EXPO_PUBLIC_WEB_URL;
  if (envUrl) return envUrl;

  if (__DEV__) {
    const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
    return devHost ? `http://${devHost}:3000` : 'http://localhost:3000';
  }

  return null;
}

export const WEB_URL = resolveWebUrl();
