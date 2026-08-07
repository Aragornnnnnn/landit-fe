// Expo 푸시 토큰 발급 — 서버 푸시 발송에 쓸 토큰을 받아 웹에 넘긴다 (등록은 웹이 백엔드에 한다)
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

// 발급은 네이티브 등록 + Expo 서버 왕복이라 비싸다. 토큰은 설치 단위로 고정이라 실행당 한 번만 받는다
let pending: Promise<string | null> | null = null;

const issue = async (): Promise<string | null> => {
  // EAS projectId가 있어야 Expo 푸시 서비스가 토큰을 발급한다 — 없으면 빌드 구성 문제라 재시도해도 소용없다
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('[push-token] EAS projectId가 없어 발급을 건너뛴다');
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch (error) {
    console.warn('[push-token] 발급 실패:', error);
    // 일시적 실패는 다음 호출에서 다시 시도한다
    pending = null;
    return null;
  }
};

export const getExpoPushToken = (): Promise<string | null> =>
  (pending ??= issue());
