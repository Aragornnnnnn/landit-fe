// 스몰톡 첫 안내를 본 기기인지 — 처음 들어온 사람에게만 한 번 띄운다
import { seenFlag } from '@/shared/lib/seen-flag';

// 안내 내용이 바뀌면 v를 올려 본 사람에게도 한 번 더 띄운다
export const introGuideSeen = seenFlag('landit-smalltalk-intro-guide-seen-v2');

/** 바뀌기 전 안내의 기록을 지운다 — 새 안내를 보고 나면 읽을 곳이 없어 기기에 남겨 둘 이유가 없다 */
export const clearOldIntroGuideSeen = () => {
  try {
    localStorage.removeItem('landit-smalltalk-intro-guide-seen');
  } catch {
    // 못 지워도 아무도 읽지 않는 값이 남을 뿐이다
  }
};
