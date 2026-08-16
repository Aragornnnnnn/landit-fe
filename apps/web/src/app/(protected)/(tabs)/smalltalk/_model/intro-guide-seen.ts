// 스몰톡 첫 안내를 본 기기인지 기록한다 — 처음 들어온 사람에게만 한 번 띄운다
const SEEN_KEY = 'landit-smalltalk-intro-guide-seen';

export const hasSeenIntroGuide = () => {
  try {
    return localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return false;
  }
};

export const markIntroGuideSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // 저장 실패 시 안내가 한 번 더 보일 뿐이라 무시한다
  }
};
