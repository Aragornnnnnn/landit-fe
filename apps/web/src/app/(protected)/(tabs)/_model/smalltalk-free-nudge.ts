'use client';

// 홈 스몰톡 칩 말풍선(무료 5분)의 기록과 차례 알림 — 말풍선은 하루 한 번(그날 첫 홈 방문)만 띄우고,
// 그동안은 홈의 시트들(이벤트 공지·소감·알림 동의)이 기다리도록 알린다. 하루 한 번이라야 영영 안 누르는 사람에게도 공지·소감이 막히지 않는다.
// 누구에게 띄울지(대화 피드백을 봤는가)는 scenario-feedback-seen이 정한다
import { useSyncExternalStore } from 'react';

import { seenFlag } from '@/shared/lib/seen-flag';

// 말풍선을 보고 스몰톡 탭에 들어가 봤다 — 그 뒤로는 다시 띄우지 않는다
export const smalltalkNudgeSeen = seenFlag('landit-smalltalk-free-nudge-seen');

const SHOWN_ON_KEY = 'landit-smalltalk-free-nudge-shown-on';
// 기기 날짜로 센다 — 서버 날짜가 기준인 학습 기록과 달리 "오늘 한 번 보여 줬나"는 화면 리듬이라 기기 시계면 충분하다
const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

/** 오늘 이미 말풍선을 보여 줬는가 — 저장소를 못 읽으면 안 보여 준 것으로 본다 */
export const nudgeShownToday = () => {
  try {
    return localStorage.getItem(SHOWN_ON_KEY) === localToday();
  } catch {
    return false;
  }
};

/** 오늘 말풍선을 보여 줬다고 남긴다 */
export const markNudgeShownToday = () => {
  try {
    localStorage.setItem(SHOWN_ON_KEY, localToday());
  } catch {
    // 못 남기면 오늘 한 번 더 보일 뿐이다
  }
};

// 말풍선 차례인가 — 탭 셸이 정하고 홈 화면이 본다. 라우팅을 건너는 값이라 메모리에 둔다
let nudgeFirst = false;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

/** 탭 셸이 말풍선 차례인지 알린다 — 띄울지 정하는 중(구독·한도 조회)도 차례로 본다 */
export const setFreeNudgeFirst = (first: boolean) => {
  if (nudgeFirst === first) return;
  nudgeFirst = first;
  listeners.forEach((listener) => listener());
};

/** 지금 말풍선 차례인가 — 홈의 이벤트 공지·소감·알림 동의 시트가 이 값을 보고 자신을 미룬다 */
export const useFreeNudgeFirst = () =>
  useSyncExternalStore(
    subscribe,
    () => nudgeFirst,
    () => false,
  );
