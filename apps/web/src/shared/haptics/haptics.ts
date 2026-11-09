// 웹 인터랙션에 햅틱 진동을 붙이는 진입점 — 진동 이름을 플랫폼별 실제 진동으로 바꿔 WebView면 네이티브 브릿지로, 일반 브라우저면 Vibration API로 보낸다
import type { HapticPattern } from '@landit/bridge';

import { getNativeContextSnapshot } from '@/shared/bridge/native-context';
import { postToNative } from '@/shared/bridge/web-bridge';

import {
  patternOf,
  type HapticKind,
  type HapticPlatform,
} from './haptic-kinds';
import {
  HAPTIC_RHYTHMS,
  rhythmDurationOf,
  type HapticRhythm,
} from './haptic-rhythms';
import { isHapticsEnabled } from './haptics-setting';

// 일반 브라우저(주로 Android)용 폴백 진동 길이(ms). iOS 브라우저는 vibrate 미지원이라 조용히 무시된다
const VIBRATION_FALLBACK: Record<HapticPattern, number | number[]> = {
  selection: 8,
  light: 10,
  medium: 18,
  heavy: 28,
  success: [12, 40, 12],
  warning: [18, 50, 18],
  error: [26, 40, 26, 40, 26],
};

// 같은 이름 연타로 진동이 뭉개지지 않게, 직전 발동으로부터 이 간격 안의 같은 이름 요청은 버린다.
// 이름별로 따로 재는 이유 — 버튼 누름의 tap이 곧이어 오는 결과 진동(success·error 등)을 눌러버리면 안 되기 때문이다.
const MIN_INTERVAL_MS = 30;
const lastFiredAt: Partial<Record<HapticKind, number>> = {};

const now = () =>
  typeof performance !== 'undefined' ? performance.now() : Date.now();

// 진동을 막아 둔 곳의 수 — 녹음처럼 여러 곳이 겹쳐 막을 수 있어 모두 풀려야 다시 울린다
let muteCount = 0;

// 녹음하는 동안 진동을 막는다 — 진동 모터 소리가 녹음에 섞이면 음성 인식·발음 평가에 잡음이 된다.
// 돌려받은 함수로 푼다. 여러 번 불러도 한 번만 풀려 남이 막아 둔 것까지 풀지 않는다
export const muteHaptics = () => {
  muteCount += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    muteCount -= 1;
  };
};

// WebView 안이면 네이티브가 expo-haptics로, 밖이면 브라우저 Vibration API로 최대한 흉내 낸다
const sendPattern = (pattern: HapticPattern) => {
  if (postToNative({ type: 'HAPTIC', pattern })) return;
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(VIBRATION_FALLBACK[pattern]);
  }
};

// 셸 밖(브라우저)은 iOS 표를 쓴다 — 폴백 진동은 길이만 다를 뿐 차이가 작다. 진동마다 주입값을 다시 파싱하지 않게 스냅샷을 쓴다
const currentPlatform = (): HapticPlatform =>
  getNativeContextSnapshot()?.platform === 'android' ? 'android' : 'ios';

// 진동을 껐거나 녹음 중이라 막아 둔 때 — 이름 진동과 리듬 박자가 같은 기준을 쓴다
const isSilenced = () => !isHapticsEnabled() || muteCount > 0;

// 진동 이름으로 햅틱을 울린다. 진동을 껐거나, WebView 밖인데 Vibration API도 없으면 아무 일도 안 한다
export const haptic = (kind: HapticKind) => {
  if (isSilenced()) return;

  const at = now();
  if (at - (lastFiredAt[kind] ?? -Infinity) < MIN_INTERVAL_MS) return;
  lastFiredAt[kind] = at;

  sendPattern(patternOf(kind, currentPlatform()));
};

// 리듬의 박자 하나 — 박자마다 다시 본다. 리듬 도중에 녹음이 시작될 수 있다
const playBeat = (pattern: HapticPattern) => {
  if (isSilenced()) return;
  sendPattern(pattern);
};

/** 리듬을 언제 울리나 — 시작 시각을 주거나, 마지막 박자가 올 시각을 준다(ms, 지금부터) */
export type HapticRhythmTiming = { startAt: number } | { endAt: number };

const startDelayOf = (name: HapticRhythm, timing?: HapticRhythmTiming) => {
  if (!timing) return 0;
  if ('startAt' in timing) return timing.startAt;
  // 리듬이 연출보다 길면 기다리지 않는다 — 마지막 박자가 조금 늦게 올 뿐이다
  return Math.max(0, timing.endAt - rhythmDurationOf(name));
};

// 리듬 진동을 울린다. 시각을 안 주면 첫 박자는 바로 울린다. 돌려받은 함수로 아직 안 온 박자를 모두 멈춘다 (화면을 떠날 때)
export const hapticRhythm = (
  name: HapticRhythm,
  timing?: HapticRhythmTiming,
) => {
  const delay = startDelayOf(name, timing);
  const timers: ReturnType<typeof setTimeout>[] = [];
  for (const { at, pattern } of HAPTIC_RHYTHMS[name]) {
    if (delay + at === 0) playBeat(pattern);
    else timers.push(setTimeout(() => playBeat(pattern), delay + at));
  }
  return () => timers.forEach(clearTimeout);
};
