// 첫 표현 투어 단계를 이 기기에 계정별로 기억한다 — 서버엔 두지 않는다.
// 저장소를 못 쓰거나 모르는 값이면 시작 전으로 본다. 쓰기만 실패하면 이번 실행 동안은 메모리 값으로 이어 간다
import { TOUR_STEPS, type TourStep } from './tour-step';

const keyOf = (userId: number) => `landit-first-expression-tour:${userId}`;
// localStorage는 같은 문서 안의 변경을 알려 주지 않아 저장할 때 직접 알린다
const watchers = new Set<() => void>();
// 저장소에 쓰지 못한 단계 — 같은 실행에서 다시 읽으면 이 값이 먼저다
const unsaved = new Map<number, TourStep>();

export const readTourStep = (userId: number): TourStep | null => {
  const pending = unsaved.get(userId);
  if (pending) return pending;
  try {
    const raw = localStorage.getItem(keyOf(userId));
    return TOUR_STEPS.find((step) => step === raw) ?? null;
  } catch {
    return null;
  }
};

export const writeTourStep = (userId: number, step: TourStep) => {
  try {
    localStorage.setItem(keyOf(userId), step);
    unsaved.delete(userId);
  } catch {
    // 저장 실패는 이번 실행의 화면만 이어 간다 — 다음 실행에 투어를 다시 볼 뿐이다
    unsaved.set(userId, step);
  }
  watchers.forEach((notify) => notify());
};

export const subscribeTourStep = (onChange: () => void) => {
  watchers.add(onChange);
  return () => {
    watchers.delete(onChange);
  };
};
