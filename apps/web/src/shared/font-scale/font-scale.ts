// 글자 크기 설정 — 처음 한 번 기기 글자 배율로 단계를 정해 저장하고, 그 뒤로는 마이페이지에서 고른 값을 유지한다
import type { NativeContext } from '@landit/bridge';

const STORAGE_KEY = 'landit-font-scale';
// 이 버전부터 셸이 Android 자동 확대를 끄고 기기 배율을 준다. 그 전 셸은 배율이 겹쳐 기능을 끈다
const FONT_SCALE_BRIDGE_VERSION = 10;
const watchers = new Set<() => void>();

/** 고를 수 있는 배율 — 가장 작게부터 가장 크게까지 순서대로. 화면도 이 순서로 그린다 */
export const FONT_SCALES = [0.85, 0.92, 1, 1.15, 1.3] as const;

export type FontScale = (typeof FONT_SCALES)[number];

export const DEFAULT_FONT_SCALE: FontScale = 1;

const isFontScale = (value: number): value is FontScale =>
  (FONT_SCALES as readonly number[]).includes(value);

// 문자열로 바뀌어 모듈 밖에서 실행되므로 바깥 변수를 참조하지 않는다 (필요한 값은 인자로 받는다)
const initFontScale = (
  scales: readonly number[],
  key: string,
  minBridgeVersion: number,
) => {
  try {
    const native = (
      window as {
        __LANDIT_NATIVE__?: { bridgeVersion?: unknown; fontScale?: unknown };
      }
    ).__LANDIT_NATIVE__;
    if (
      native &&
      !(
        typeof native.bridgeVersion === 'number' &&
        native.bridgeVersion >= minBridgeVersion
      )
    ) {
      return;
    }
    const apply = (scale: number) =>
      document.documentElement.style.setProperty('--font-scale', String(scale));

    const saved = Number(localStorage.getItem(key) ?? NaN);
    if (scales.includes(saved)) {
      apply(saved);
      return;
    }
    // 셸 주입이 아직 없으면 정하지 않는다 — 늦게 온 기기 배율로 다음 실행에서 정한다
    const device = native?.fontScale;
    if (typeof device !== 'number') return;
    const closest = scales.reduce((best, scale) =>
      Math.abs(scale - device) < Math.abs(best - device) ? scale : best,
    );
    localStorage.setItem(key, String(closest));
    apply(closest);
  } catch {
    // 저장소를 못 쓰면 기본 크기로 둔다
  }
};

/** 저장값이나 기기 배율로 첫 단계를 정해 적용한다. 하이드레이션 뒤에 다시 불러도 된다 */
export const applyInitialFontScale = () =>
  initFontScale(FONT_SCALES, STORAGE_KEY, FONT_SCALE_BRIDGE_VERSION);

/** 첫 페인트 전에 실행할 인라인 스크립트 */
export const fontScaleScript = `(${initFontScale.toString()})(${JSON.stringify(FONT_SCALES)}, ${JSON.stringify(STORAGE_KEY)}, ${FONT_SCALE_BRIDGE_VERSION})`;

/** 셸 밖(브라우저)이거나 브릿지 10 이상 셸이면 쓸 수 있다 */
export const isFontScaleAvailable = (context: NativeContext | null) =>
  context === null || context.bridgeVersion >= FONT_SCALE_BRIDGE_VERSION;

/** 지금 단계. 저장값이 없거나 목록 밖이면 보통으로 본다 */
export const getFontScale = (): FontScale => {
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY) ?? NaN);
    return isFontScale(saved) ? saved : DEFAULT_FONT_SCALE;
  } catch {
    return DEFAULT_FONT_SCALE;
  }
};

export const setFontScale = (scale: FontScale) => {
  // 목록 밖 값은 저장소에 들이지 않는다
  if (!isFontScale(scale)) return;
  // 보통도 지우지 않고 저장한다 — 지우면 다음 실행에서 기기 배율로 다시 정해진다
  try {
    localStorage.setItem(STORAGE_KEY, String(scale));
  } catch {
    // 저장 실패는 무시한다 — 이번 세션만 반영된다
  }
  document.documentElement.style.setProperty('--font-scale', String(scale));
  watchers.forEach((notify) => notify());
};

/** useSyncExternalStore용 — 단계가 바뀌면 같은 문서의 구독자에게 알린다 */
export const subscribeFontScale = (onChange: () => void) => {
  watchers.add(onChange);
  return () => {
    watchers.delete(onChange);
  };
};
