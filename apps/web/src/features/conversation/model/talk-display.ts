// 대화 표시 설정 — 마이페이지에서 고르고, 대화를 시작할 때 첫 상태로 읽는다. 기본값과 다를 때만 기기에 남는다
import { deviceSetting } from '@/shared/lib/device-setting';

const DEFAULTS = {
  alwaysShowText: false,
  alwaysShowTranslation: false,
};

export type DisplaySettingKey = keyof typeof DEFAULTS;

const displaySetting = (key: string, defaultValue: boolean) =>
  deviceSetting<boolean>({
    key,
    defaultValue,
    parse: (saved) => saved === 'true',
  });

// 저장 키는 다른 기기 설정과 같은 소문자·하이픈 형식으로 둔다
const SETTINGS: Record<DisplaySettingKey, ReturnType<typeof displaySetting>> = {
  alwaysShowText: displaySetting(
    'landit-talk-always-show-text',
    DEFAULTS.alwaysShowText,
  ),
  alwaysShowTranslation: displaySetting(
    'landit-talk-always-show-translation',
    DEFAULTS.alwaysShowTranslation,
  ),
};

/** 지금 값. 저장값이 없거나 읽을 수 없으면 기본값으로 본다 */
export const getDisplaySetting = (key: DisplaySettingKey) =>
  SETTINGS[key].get();

/** 서버 렌더에서 쓰는 값 — 저장소를 못 읽으니 기본값이다 */
export const getDefaultDisplaySetting = (key: DisplaySettingKey) =>
  DEFAULTS[key];

export const setDisplaySetting = (key: DisplaySettingKey, value: boolean) =>
  SETTINGS[key].set(value);

/** useSyncExternalStore용 — 어느 값이든 바뀌면 같은 문서의 구독자에게 알린다 */
export const subscribeDisplaySettings = (onChange: () => void) => {
  const stops = Object.values(SETTINGS).map((setting) =>
    setting.subscribe(onChange),
  );
  return () => stops.forEach((stop) => stop());
};
