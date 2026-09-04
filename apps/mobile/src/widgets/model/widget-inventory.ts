// iOS 위젯 설치·삭제 감지 — 설치 콜백이 없어서 "지금 놓인 목록"을 지난번 목록과 비교해 추가·삭제를 알아낸다.
// 앱 실행·포그라운드 복귀 때 부른다. 안드로이드는 프로바이더 콜백(WIDGET_ADDED/DELETED)이 있어 이 길을 안 쓴다
import { Platform } from 'react-native';
import { widgetFamilySchema, type WidgetFamily } from '@landit/bridge';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getInstalledWidgetFamilies } from '../../../modules/widget-inventory';
import { recordWidgetChange, type WidgetChangeRecord } from './widget-changes';

const STORAGE_KEY = 'landit.widget.inventory';

// 크기별 개수 차이를 추가·삭제 건으로 푼다 — 같은 크기를 둘 놓으면 added 두 건
export const diffWidgetInventory = (
  previous: WidgetFamily[],
  current: WidgetFamily[],
): WidgetChangeRecord[] => {
  const changes: WidgetChangeRecord[] = [];
  for (const family of widgetFamilySchema.options) {
    const before = previous.filter((item) => item === family).length;
    const after = current.filter((item) => item === family).length;
    for (let i = 0; i < after - before; i += 1) {
      changes.push({ change: 'added', family });
    }
    for (let i = 0; i < before - after; i += 1) {
      changes.push({ change: 'removed', family });
    }
  }
  return changes;
};

const loadSnapshot = async (): Promise<WidgetFamily[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is WidgetFamily =>
            widgetFamilySchema.safeParse(item).success,
        )
      : [];
  } catch {
    return [];
  }
};

// 목록을 읽어 지난번과 다른 만큼 기록하고, 이번 목록을 다음 비교 기준으로 남긴다.
// 처음(기준 없음)엔 놓인 것 전부가 추가로 잡힌다 — 위젯이 실린 첫 릴리즈라 그 전에 놓인 위젯은 없다
export const syncWidgetInventory = async (): Promise<void> => {
  if (Platform.OS !== 'ios') return;
  try {
    const current = (await getInstalledWidgetFamilies()).filter(
      (item): item is WidgetFamily =>
        widgetFamilySchema.safeParse(item).success,
    );
    const changes = diffWidgetInventory(await loadSnapshot(), current);
    for (const change of changes) await recordWidgetChange(change);
    if (changes.length > 0) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }
  } catch (error) {
    console.warn('[widget] 설치 목록 조회 실패', error);
  }
};
