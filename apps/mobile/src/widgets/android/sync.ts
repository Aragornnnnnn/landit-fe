// 안드로이드 위젯 동기화 — 타임라인 예약이 없으므로 등록된 위젯 3종을 지금 위젯 데이터로 즉시 다시 그린다
// (주기 갱신은 app.json의 updatePeriodMillis로 시스템이 맡는다)
import type { WidgetData } from '@landit/bridge';

export const syncAndroidWidgets = (data: WidgetData): void => {
  try {
    const { requestWidgetUpdate } =
      require('react-native-android-widget') as typeof import('react-native-android-widget');
    const { renderStreakWidget } =
      require('./widget-task-handler') as typeof import('./widget-task-handler');
    const { ANDROID_WIDGET_NAMES } =
      require('./families') as typeof import('./families');

    for (const widgetName of ANDROID_WIDGET_NAMES) {
      requestWidgetUpdate({
        widgetName,
        renderWidget: (info) => renderStreakWidget(info, data),
      }).catch((error) =>
        console.warn('[widget] 안드로이드 위젯 갱신 실패', widgetName, error),
      );
    }
  } catch (error) {
    console.warn('[widget] 안드로이드 위젯 갱신 실패', error);
  }
};
