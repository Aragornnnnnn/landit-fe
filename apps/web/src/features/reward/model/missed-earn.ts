// 환급을 시작하지 않은 사람이 방금 오늘의 시나리오를 끝냈다는 표시 — 홈에 돌아오면 "받을 수 있었던 금액" 연출을 한 번 튼다.
// 앱을 새로 열면 잊는다. 한참 전에 끝낸 대화를 방금 끝낸 것처럼 보이면 안 된다
let missedUserId: number | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

export const markMissedEarn = (userId: number) => {
  if (missedUserId === userId) return;
  missedUserId = userId;
  notify();
};

// 다른 계정이 끝낸 대화는 내 것이 아니다
export const hasMissedEarn = (userId: number) => missedUserId === userId;

// 연출을 다 보여 줬거나, 볼 사람이 아니게 됐다
export const clearMissedEarn = () => {
  if (missedUserId === null) return;
  missedUserId = null;
  notify();
};

export const subscribeMissedEarn = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
