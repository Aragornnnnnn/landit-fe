// 글자 크기 설정 — 처음엔 보통이고, 마이페이지에서 고른 값을 유지한다. 구 셸은 늘 보통으로 보이게 한다
import type { NativeContext } from '@landit/bridge';

// v2: 기기 배율로 첫 단계를 정하던 때의 저장값을 버리고 모두 보통에서 시작한다
const STORAGE_KEY = 'landit-font-scale-v2';
// 이 버전부터 셸이 Android 자동 확대를 끈다. 그 전 셸은 기능을 끄고 늘 보통으로 보이게 한다
const FONT_SCALE_BRIDGE_VERSION = 10;
// Android 웹뷰 사용자 에이전트 표식 — 주입이 없는데 웹뷰면 구 셸(자동 확대가 켜진 셸)로 본다
const ANDROID_WEBVIEW_UA = '; wv)';
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
  webviewMarker: string,
) => {
  try {
    const native = (
      window as {
        __LANDIT_NATIVE__?: { bridgeVersion?: unknown };
      }
    ).__LANDIT_NATIVE__;
    const apply = (scale: number) =>
      document.documentElement.style.setProperty('--font-scale', String(scale));
    // 주입이 빠진 Android 웹뷰는 브라우저가 아니라 구 셸이다 — 셸이 기기 글꼴 크기를 이미 곱하고 있다
    const isOldShell =
      (!native && navigator.userAgent.includes(webviewMarker)) ||
      (native &&
        !(
          typeof native.bridgeVersion === 'number' &&
          native.bridgeVersion >= minBridgeVersion
        ));
    if (isOldShell) {
      // 구 셸은 늘 보통으로 보인다 — Android 웹뷰는 셸이 키운 배율이 계산된 글자 크기에 그대로 실려, 100px이 몇 px로 계산되는지 보고 되돌린다
      const probe = document.createElement('span');
      probe.style.cssText =
        'position:absolute;visibility:hidden;font-size:100px';
      document.documentElement.appendChild(probe);
      const zoom = parseFloat(getComputedStyle(probe).fontSize) / 100;
      probe.remove();
      if (zoom > 0 && Math.abs(zoom - 1) > 0.02) apply(1 / zoom);
      return;
    }

    // 고른 적이 없으면 기기 배율과 상관없이 보통으로 둔다
    const saved = Number(localStorage.getItem(key) ?? NaN);
    if (scales.includes(saved)) apply(saved);
  } catch {
    // 저장소를 못 쓰면 기본 크기로 둔다
  }
};

/** 저장값을 적용한다. 하이드레이션 뒤에 다시 불러도 된다 */
export const applyInitialFontScale = () =>
  initFontScale(
    FONT_SCALES,
    STORAGE_KEY,
    FONT_SCALE_BRIDGE_VERSION,
    ANDROID_WEBVIEW_UA,
  );

/** 첫 페인트 전에 실행할 인라인 스크립트 */
export const fontScaleScript = `(${initFontScale.toString()})(${JSON.stringify(FONT_SCALES)}, ${JSON.stringify(STORAGE_KEY)}, ${FONT_SCALE_BRIDGE_VERSION}, ${JSON.stringify(ANDROID_WEBVIEW_UA)})`;

/** 브릿지 10 이상 셸이거나 셸 밖 브라우저면 쓸 수 있다. 주입 없는 Android 웹뷰는 구 셸이라 쓸 수 없다 */
export const isFontScaleAvailable = (
  context: NativeContext | null,
  userAgent: string,
) =>
  context === null
    ? !userAgent.includes(ANDROID_WEBVIEW_UA)
    : context.bridgeVersion >= FONT_SCALE_BRIDGE_VERSION;

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
  // 보통도 지우지 않고 저장한다 — 고른 값이 그대로 남게
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
