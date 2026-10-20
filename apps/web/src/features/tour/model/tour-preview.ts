// 첫 대화 뒤 투어 다시 보기(ADMIN) — 이 계정의 투어 단계를 고른 자리로 돌리고, 이번 실행 동안 투어를 볼 수 있는 사람으로 친다.
// 유료 계정·환급 스위치가 꺼진 환경에서도 홈에서 튜토리얼부터 다시 보게 하려는 것이라 세션 저장소에만 둔다 — 앱을 다시 열면 꺼진다
import type { TourStep } from './tour-step';
import { writeTourStep } from './tour-store';

const KEY = 'landit-first-expression-tour-preview';
// 세션 저장소를 못 쓰는 환경에서는 이번 실행 동안 메모리로 기억한다
let started = false;

/**
 * @param lastDone 끝낸 것으로 둘 단계 — 그다음 화면부터 본다. 기본은 피드백을 막 마친 자리(튜토리얼 차례)
 */
export const startTourPreview = (
  userId: number,
  lastDone: TourStep = 'STARTED',
) => {
  writeTourStep(userId, lastDone);
  started = true;
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    // 메모리 값으로 이어 간다
  }
};

export const isTourPreview = (): boolean => {
  if (started) return true;
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};
