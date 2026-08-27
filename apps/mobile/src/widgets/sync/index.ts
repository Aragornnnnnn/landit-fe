// 위젯 동기화 진입점 — 플랫폼별 갱신 방식(iOS 타임라인 예약 / 안드로이드 즉시 재렌더)을 감춘다
import { Platform } from 'react-native';
import { EMPTY_WIDGET_DATA, type WidgetData } from '@landit/bridge';

import { loadWidgetData } from '../widget-store';
import { syncAndroidWidgets } from './android';
import { syncIosWidget } from './ios';

export const syncStreakWidget = (data: WidgetData): void => {
  if (Platform.OS === 'android') {
    syncAndroidWidgets(data);
    return;
  }
  if (Platform.OS === 'ios') void syncIosWidget(data);
};

// 앱 실행 시 위젯을 되살린다 — iOS는 예약 창을 오늘부터 다시 잡고, 안드로이드는 즉시 재렌더.
// 저장된 데이터가 없으면(로그인 전) 0일 신규 상태로 그린다
export const syncWidgetOnLaunch = async (): Promise<void> => {
  syncStreakWidget((await loadWidgetData()) ?? EMPTY_WIDGET_DATA);
};
