// 안드로이드 위젯 태스크 핸들러 — 시스템 갱신 주기·추가 시점마다 위젯 데이터로 화면을 다시 그린다
import { EMPTY_WIDGET_DATA, type WidgetData } from '@landit/bridge';
import type {
  WidgetInfo,
  WidgetTaskHandler,
} from 'react-native-android-widget';

import { buildWeekStrip } from '../model/week-strip';
import { recordWidgetChange } from '../model/widget-changes';
import { decideWidgetState } from '../model/widget-state';
import { loadWidgetData } from '../model/widget-store';
import { familyForWidget } from './families';
import { StreakAndroidWidget } from './StreakAndroidWidget';

// 위젯 데이터가 주어지면 그대로, 없으면 저장소에서 읽는다 — 로그인 전에는 0일 기본값으로 그린다
export const renderStreakWidget = async (
  widgetInfo: WidgetInfo,
  widgetData?: WidgetData,
) => {
  const data = widgetData ?? (await loadWidgetData()) ?? EMPTY_WIDGET_DATA;
  const now = new Date();
  return (
    <StreakAndroidWidget
      state={decideWidgetState({ data, now })}
      week={buildWeekStrip({
        weeklyDone: data.weeklyDone,
        capturedOn: data.capturedOn,
        now,
      })}
      family={familyForWidget(widgetInfo.widgetName)}
      width={widgetInfo.width}
      height={widgetInfo.height}
    />
  );
};

export const widgetTaskHandler: WidgetTaskHandler = async ({
  widgetInfo,
  widgetAction,
  renderWidget,
}) => {
  // 홈 화면에 놓이거나 치워진 건 계측용으로 쌓는다 — 셸이 웹으로 보낸다
  if (widgetAction === 'WIDGET_ADDED' || widgetAction === 'WIDGET_DELETED') {
    await recordWidgetChange({
      change: widgetAction === 'WIDGET_ADDED' ? 'added' : 'removed',
      family: familyForWidget(widgetInfo.widgetName),
    });
  }
  // 클릭은 OPEN_URI(위젯 딥링크)로 네이티브가 처리하고, 삭제는 그릴 것이 없다
  if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') {
    return;
  }
  renderWidget(await renderStreakWidget(widgetInfo));
};
