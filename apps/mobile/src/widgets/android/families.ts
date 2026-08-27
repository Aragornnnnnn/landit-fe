// 안드로이드 위젯 이름·사이즈 매핑 — app.json의 react-native-android-widget 등록 이름과 1:1
import type { WidgetFamily } from '../widget-art-key';

export const ANDROID_WIDGETS = {
  StreakSmall: 'small',
  StreakMedium: 'medium',
  StreakLarge: 'large',
} as const satisfies Record<string, WidgetFamily>;

export type AndroidWidgetName = keyof typeof ANDROID_WIDGETS;

export const ANDROID_WIDGET_NAMES = Object.keys(
  ANDROID_WIDGETS,
) as AndroidWidgetName[];

export const familyForWidget = (name: string): WidgetFamily =>
  ANDROID_WIDGETS[name as AndroidWidgetName] ?? 'small';
