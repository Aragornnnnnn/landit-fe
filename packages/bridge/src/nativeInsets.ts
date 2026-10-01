// 셸이 잰 시스템 바 inset을 웹에 CSS 변수로 넘기는 계약 — 구형 Android WebView는 env(safe-area-inset-*)를 0으로 준다

export const NATIVE_INSET_VARS = {
  top: '--native-inset-top',
  bottom: '--native-inset-bottom',
} as const;

// CSS px 단위 (RN의 dp와 1:1)
type NativeInsets = {
  top: number;
  bottom: number;
};

// 로드 전 시점엔 문서 루트가 없을 수 있어, 그때는 루트가 생기는 순간 세팅해 첫 페인트 전에 값을 넣는다
export const buildNativeInsetsScript = ({ top, bottom }: NativeInsets) =>
  '(function(){' +
  ' function apply(){ var r = document.documentElement; if (!r) return false;' +
  ` r.style.setProperty("${NATIVE_INSET_VARS.top}", "${top}px");` +
  ` r.style.setProperty("${NATIVE_INSET_VARS.bottom}", "${bottom}px");` +
  ' return true; }' +
  ' if (apply()) return;' +
  ' new MutationObserver(function(_, o){ if (apply()) o.disconnect(); }).observe(document, { childList: true });' +
  ' })();';
