// 안드로이드 위젯 태스크 핸들러 — 시스템 갱신 주기·추가 시점마다 스냅샷으로 화면을 다시 그린다
import { EMPTY_WIDGET_DATA, type WidgetData } from '@landit/bridge';
import type {
  WidgetInfo,
  WidgetTaskHandler,
} from 'react-native-android-widget';

import { buildWeekStrip } from '../week-strip';
import { decideWidgetState } from '../widget-state';
import { loadWidgetData } from '../widget-store';
import { familyForWidget } from './families';
import { StreakAndroidWidget } from './StreakAndroidWidget';

// 스냅샷이 주어지면 그대로, 없으면 저장소에서 읽는다 — 로그인 전에는 0일 기본값으로 그린다
export const renderStreakWidget = async (
  widgetInfo: WidgetInfo,
  snapshot?: WidgetData,
) => {
  const data = snapshot ?? (await loadWidgetData()) ?? EMPTY_WIDGET_DATA;
  const now = new Date();
  return (
    <StreakAndroidWidget
      state={decideWidgetState({ data, now })}
      week={buildWeekStrip({ weeklyDone: data.weeklyDone, now })}
      family={familyForWidget(widgetInfo.widgetName)}
      width={widgetInfo.width}
      height={widgetInfo.height}
      todayCardTitle={data.todayCardTitle ?? undefined}
    />
  );
};

export const widgetTaskHandler: WidgetTaskHandler = async ({
  widgetInfo,
  widgetAction,
  renderWidget,
}) => {
  // 클릭은 OPEN_APP으로 네이티브가 처리하고, 삭제는 그릴 것이 없다
  if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') {
    return;
  }
  renderWidget(await renderStreakWidget(widgetInfo));
};
