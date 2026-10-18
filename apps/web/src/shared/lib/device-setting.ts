// 이 기기에만 남는 설정값 하나 — 기본값과 다를 때만 저장하고, 바뀌면 같은 문서의 구독자에게 알린다.
// 저장소를 못 쓰면(비공개 모드 등) 기본값으로 물러선다 — 이번 세션만 반영되지 않을 뿐이다

interface DeviceSettingOptions<T> {
  key: string;
  defaultValue: T;
  // 저장된 문자열을 값으로 읽는다. 읽을 수 없으면 undefined를 돌려 기본값으로 물러선다
  parse: (saved: string) => T | undefined;
  serialize?: (value: T) => string;
}

export const deviceSetting = <T>({
  key,
  defaultValue,
  parse,
  serialize = String,
}: DeviceSettingOptions<T>) => {
  const watchers = new Set<() => void>();

  return {
    /** 지금 값. 저장값이 없거나 읽을 수 없으면 기본값 */
    get: (): T => {
      try {
        const saved = localStorage.getItem(key);
        return saved === null ? defaultValue : (parse(saved) ?? defaultValue);
      } catch {
        return defaultValue;
      }
    },
    set: (value: T) => {
      try {
        if (value === defaultValue) localStorage.removeItem(key);
        else localStorage.setItem(key, serialize(value));
      } catch {
        // 저장 실패는 무시한다 — 이번 세션만 반영되지 않을 뿐이다
      }
      watchers.forEach((notify) => notify());
    },
    /** useSyncExternalStore용 — 값이 바뀌면 같은 문서의 구독자에게 알린다 */
    subscribe: (onChange: () => void) => {
      watchers.add(onChange);
      return () => {
        watchers.delete(onChange);
      };
    },
  };
};
