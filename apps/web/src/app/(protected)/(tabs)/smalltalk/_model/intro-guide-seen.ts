// 스몰톡 첫 안내를 본 기기인지 — 아직 안 본 사람에게 한 번 띄운다. 탭 셸의 스몰톡 칩 점도 이 기록을 본다
import { seenFlag } from '@/shared/lib/seen-flag';

// 안내 내용이 바뀌면 v를 올려 본 사람에게도 한 번 더 띄운다 — v3는 무료 5분 안내(2026-10-30), 기존 무료 사용자도 다시 본다
export const introGuideSeen = seenFlag('landit-smalltalk-intro-guide-seen-v3');

const OLD_KEYS = [
  'landit-smalltalk-intro-guide-seen',
  'landit-smalltalk-intro-guide-seen-v2',
];

/** 바뀌기 전 안내의 기록을 지운다 — 새 안내를 보고 나면 읽을 곳이 없어 기기에 남겨 둘 이유가 없다 */
export const clearOldIntroGuideSeen = () => {
  try {
    OLD_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // 못 지워도 아무도 읽지 않는 값이 남을 뿐이다
  }
};
