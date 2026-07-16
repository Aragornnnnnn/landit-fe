// 웹 인터랙션에 햅틱 진동을 붙이는 진입점 — WebView면 네이티브 브릿지로, 일반 브라우저면 Vibration API로 폴백한다
import type { HapticPattern } from '@landit/bridge';

import { postToNative } from '@/shared/bridge/web-bridge';

// 일반 브라우저(주로 Android)용 폴백 진동 패턴(ms). iOS 브라우저는 vibrate 미지원이라 조용히 무시된다
const VIBRATION_FALLBACK: Record<HapticPattern, number | number[]> = {
  selection: 8,
  light: 10,
  medium: 18,
  heavy: 28,
  success: [12, 40, 12],
  warning: [18, 50, 18],
  error: [26, 40, 26, 40, 26],
};

// 같은 패턴 연타로 진동이 뭉개지지 않게, 직전 발동으로부터 이 간격 안의 같은 패턴 요청은 버린다.
// 패턴별로 따로 재는 이유 — 버튼 눌림의 selection 틱이 곧이어 오는 결과 진동(success/error 등)을 눌러버리면 안 되기 때문이다.
const MIN_INTERVAL_MS = 30;
const lastFiredAt: Partial<Record<HapticPattern, number>> = {};

const now = () =>
  typeof performance !== 'undefined' ? performance.now() : Date.now();

// 지정한 패턴으로 햅틱을 울린다. WebView 밖이면 Vibration API로 폴백하고, 그마저 없으면 아무 일도 안 한다
export const haptic = (pattern: HapticPattern) => {
  const at = now();
  if (at - (lastFiredAt[pattern] ?? -Infinity) < MIN_INTERVAL_MS) return;
  lastFiredAt[pattern] = at;

  // WebView 안이면 네이티브가 expo-haptics로 처리한다
  if (postToNative({ type: 'HAPTIC', pattern })) return;

  // 밖이면 브라우저 Vibration API로 최대한 흉내 낸다
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(VIBRATION_FALLBACK[pattern]);
  }
};
