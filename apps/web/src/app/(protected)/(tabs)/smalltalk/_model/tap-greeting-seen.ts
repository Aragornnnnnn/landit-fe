// 캐릭터를 누르면 인사한다는 걸 배운 기기인지 기록한다 — 딤 코치마크는 처음 한 번만 띄운다
const SEEN_KEY = 'landit-smalltalk-tap-greeting-seen';

export const hasSeenTapGreeting = () => {
  try {
    return localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return false;
  }
};

export const markTapGreetingSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // 저장 실패 시 코치마크가 한 번 더 보일 뿐이라 무시한다
  }
};
