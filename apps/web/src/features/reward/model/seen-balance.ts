// 헤더가 마지막으로 보여 준 환급액 — 학습을 끝내고 돌아왔을 때 그사이 늘어난 만큼만 연출하려고 기억해 둔다.
// 앱을 새로 열면 잊는다. 첫 화면에서 이미 쌓여 있던 금액을 방금 받은 것처럼 보이면 안 된다
let seen: { userId: number; balanceWon: number } | null = null;
const listeners = new Set<() => void>();

// 다른 계정이 본 금액은 내 것이 아니다 — 계정을 바꾸면 처음 보는 것으로 친다
export const readSeenBalance = (userId: number) =>
  seen?.userId === userId ? seen.balanceWon : null;

export const markBalanceSeen = (userId: number, balanceWon: number) => {
  if (readSeenBalance(userId) === balanceWon) return;
  seen = { userId, balanceWon };
  listeners.forEach((listener) => listener());
};

// 본 금액이 바뀌면 알려 준다 — 헤더의 연출이 끝난 걸 홈 화면도 같이 알아야 한다
export const subscribeSeenBalance = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// 테스트가 초기화에 쓴다 — 계정 구분은 읽을 때 하니 로그아웃에 걸 필요가 없다
export const forgetSeenBalance = () => {
  seen = null;
};

export interface BalanceGain {
  fromWon: number;
  toWon: number;
}

// 마지막으로 본 금액보다 늘었으면 그만큼이 방금 받은 것이다. 본 적이 없거나 줄었으면(자정 초기화) 연출할 것이 없다
export const balanceGainOf = (
  seenWon: number | null,
  balanceWon: number | null,
): BalanceGain | null =>
  seenWon !== null && balanceWon !== null && balanceWon > seenWon
    ? { fromWon: seenWon, toWon: balanceWon }
    : null;
