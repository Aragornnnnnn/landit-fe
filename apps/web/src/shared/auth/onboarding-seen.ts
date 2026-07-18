// 온보딩을 끝까지 본 기기인지 localStorage로 기록한다 — newUser=false여도 못 본 유저를 구제하는 분기용
const STORAGE_KEY = 'landit-onboarding-seen';

export const hasSeenOnboarding = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
};

export const markOnboardingSeen = () => {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // 저장 실패 시 다음 로그인에 온보딩이 한 번 더 보일 뿐이라 무시한다
  }
};
