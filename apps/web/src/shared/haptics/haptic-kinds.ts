// 화면 코드가 부르는 진동 이름 6가지와 이름마다 플랫폼별로 울릴 실제 진동 — 진동 느낌을 바꿀 땐 이 표만 고친다
import type { HapticPattern } from '@landit/bridge';

export const HAPTIC_KINDS = [
  'tap',
  'tick',
  'success',
  'celebrate',
  'warning',
  'error',
] as const;

export type HapticKind = (typeof HAPTIC_KINDS)[number];

export type HapticPlatform = 'ios' | 'android';

// 이름마다 언제 쓰고 어떤 화면 반응과 같이 나오는지는 docs/haptics.md에 있다
const PATTERN_OF_KIND: Record<
  HapticKind,
  Record<HapticPlatform, HapticPattern>
> = {
  // 눌렀다 (대부분 GlobalHaptics가 자동으로 울린다)
  tap: { ios: 'light', android: 'light' },
  // 값이 한 칸 바뀌었다. Android selection은 거의 안 느껴져 light
  tick: { ios: 'selection', android: 'light' },
  // 일이 잘 끝났다
  success: { ios: 'success', android: 'success' },
  // 축하할 순간이다. 지금은 success와 같고, 축하 전용 진동은 앱 업데이트 때 이 줄만 바꾼다
  celebrate: { ios: 'success', android: 'success' },
  // 막혔다, 다시 해 보자 (학습 의욕을 꺾지 않게 error와 나눈다)
  warning: { ios: 'warning', android: 'warning' },
  // 실패했다
  error: { ios: 'error', android: 'error' },
};

export const isHapticKind = (value: string): value is HapticKind =>
  (HAPTIC_KINDS as readonly string[]).includes(value);

export const patternOf = (
  kind: HapticKind,
  platform: HapticPlatform,
): HapticPattern => PATTERN_OF_KIND[kind][platform];
