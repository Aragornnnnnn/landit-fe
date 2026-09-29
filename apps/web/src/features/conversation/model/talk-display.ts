// 대화 표시 설정 — 마이페이지에서 고르고, 대화를 시작할 때 첫 상태로 읽는다. 기본값과 다를 때만 기기에 남는다
const DEFAULTS = {
  hideText: true,
  alwaysShowTranslation: false,
};

export type DisplaySettingKey = keyof typeof DEFAULTS;

// 저장 키는 다른 기기 설정과 같은 소문자·하이픈 형식으로 둔다
const STORAGE_KEYS: Record<DisplaySettingKey, string> = {
  hideText: 'landit-talk-hide-text',
  alwaysShowTranslation: 'landit-talk-always-show-translation',
};
const storageKey = (key: DisplaySettingKey) => STORAGE_KEYS[key];
const watchers = new Set<() => void>();

/** 지금 값. 저장값이 없거나 읽을 수 없으면 기본값으로 본다 */
export const getDisplaySetting = (key: DisplaySettingKey): boolean => {
  try {
    const saved = localStorage.getItem(storageKey(key));
    return saved === null ? DEFAULTS[key] : saved === 'true';
  } catch {
    return DEFAULTS[key];
  }
};

/** 서버 렌더에서 쓰는 값 — 저장소를 못 읽으니 기본값이다 */
export const getDefaultDisplaySetting = (key: DisplaySettingKey) =>
  DEFAULTS[key];

export const setDisplaySetting = (key: DisplaySettingKey, value: boolean) => {
  try {
    if (value === DEFAULTS[key]) localStorage.removeItem(storageKey(key));
    else localStorage.setItem(storageKey(key), String(value));
  } catch {
    // 저장 실패는 무시한다 — 이번 세션만 반영되지 않을 뿐이다
  }
  watchers.forEach((notify) => notify());
};

/** useSyncExternalStore용 — 값이 바뀌면 같은 문서의 구독자에게 알린다 */
export const subscribeDisplaySettings = (onChange: () => void) => {
  watchers.add(onChange);
  return () => {
    watchers.delete(onChange);
  };
};
