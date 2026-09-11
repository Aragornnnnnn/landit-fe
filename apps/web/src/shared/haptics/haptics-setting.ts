// 진동 켬/끔 설정 — 마이페이지 토글이 바꾸고 haptic()이 읽는다. 기본은 켬이라 "껐다"만 기기에 남긴다
const STORAGE_KEY = 'landit-haptics-off';
const watchers = new Set<() => void>();

/** 진동이 켜져 있는가. 저장소를 못 읽으면 켠 것으로 본다 */
export const isHapticsEnabled = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === null;
  } catch {
    return true;
  }
};

export const setHapticsEnabled = (enabled: boolean) => {
  try {
    if (enabled) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // 저장 실패는 무시한다 — 이번 세션만 반영되지 않을 뿐이다
  }
  watchers.forEach((notify) => notify());
};

/** useSyncExternalStore용 — 토글이 바뀌면 같은 문서의 구독자에게 알린다 */
export const subscribeHapticsSetting = (onChange: () => void) => {
  watchers.add(onChange);
  return () => {
    watchers.delete(onChange);
  };
};
