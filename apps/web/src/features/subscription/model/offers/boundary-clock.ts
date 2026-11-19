// 경계 시각을 넘을 때만 바뀌는 시계 — 판매 종료처럼 정해진 시각에 화면이 스스로 바뀌게 한다.
// 그 사이에는 같은 값을 돌려줘 useSyncExternalStore가 렌더마다 다시 그리지 않는다

// setTimeout이 받을 수 있는 가장 긴 지연(약 24.8일) — 넘으면 바로 실행돼 버린다
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * @param boundaries 화면이 바뀌어야 하는 시각들(epoch ms)
 * @param readPinned 실제 시각 대신 쓸 시각 — 개발자 점검에서 종료 전·후를 미리 본다. 없으면 null
 */
export const createBoundaryClock = (
  boundaries: readonly number[],
  readPinned: () => number | null = () => null,
) => {
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let snapshot = readPinned() ?? Date.now();

  /** 지나온 경계의 수 — 이 수가 같으면 판정도 같다 */
  const passedCount = (now: number) =>
    boundaries.filter((boundary) => boundary <= now).length;

  const getSnapshot = () => {
    const now = readPinned() ?? Date.now();
    if (passedCount(now) !== passedCount(snapshot)) snapshot = now;
    return snapshot;
  };

  const arm = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    const now = Date.now();
    const next = boundaries
      .filter((boundary) => boundary > now)
      .sort((a, b) => a - b)[0];
    if (next === undefined || listeners.size === 0) return;
    timer = setTimeout(
      () => {
        // 상한에 걸려 일찍 깼으면 알리지 않고 다시 건다
        if (Date.now() >= next) listeners.forEach((notify) => notify());
        arm();
      },
      Math.min(next - now, MAX_TIMEOUT_MS),
    );
  };

  return {
    getSnapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      arm();
      return () => {
        listeners.delete(listener);
        arm();
      };
    },
    /** 고정한 시각이 바뀌었을 때 부른다 — 구독한 화면이 새 시각으로 다시 판정한다 */
    refresh: () => listeners.forEach((notify) => notify()),
  };
};
