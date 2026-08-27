// 위젯 동기화 진입점 — 플랫폼별 갱신 방식을 감춘다
import type { WidgetData } from '@landit/bridge';
import { Platform } from 'react-native';

import { EMPTY_WIDGET_DATA, loadWidgetData } from '../widget-store';
import { syncIosWidget } from './ios';

export const syncStreakWidget = (data: WidgetData): void => {
  if (Platform.OS === 'ios') void syncIosWidget(data);
};

// 앱 실행 시 위젯을 되살린다 — iOS는 타임라인 3일 창을 연장한다.
// 저장된 데이터가 없으면(로그인 전) 0일 신규 상태로 그린다
export const syncWidgetOnLaunch = async (): Promise<void> => {
  syncStreakWidget((await loadWidgetData()) ?? EMPTY_WIDGET_DATA);
};
