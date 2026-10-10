// 마지막으로 로그인한 방법을 기기에 남긴다 — 로그아웃하면 세션의 provider는 지워지므로 로그인 화면 전용으로 따로 둔다
import type { SocialProvider } from './useSocialLogin';

const STORAGE_KEY = 'landit-last-login-provider';
const PROVIDERS: SocialProvider[] = ['kakao', 'google', 'apple'];

export const rememberLoginProvider = (provider: SocialProvider) => {
  try {
    localStorage.setItem(STORAGE_KEY, provider);
  } catch {
    // 저장 실패 시 다음 방문에 표시가 안 뜰 뿐이라 무시한다
  }
};

export const readLastLoginProvider = (): SocialProvider | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return PROVIDERS.find((provider) => provider === saved) ?? null;
  } catch {
    return null;
  }
};
