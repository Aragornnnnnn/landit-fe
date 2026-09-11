// 위젯 데이터 저장소 — 셸이 브릿지로 받은 데이터를 기록하고, 위젯 갱신 코드가 읽는다.
// 낡음 판정은 여기서 하지 않는다 — 데이터에 기준일(capturedOn)이 실려 있어 그리는 쪽이 판단한다
import { widgetDataSchema, type WidgetData } from '@landit/bridge';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { reportWarning } from '../../monitoring/report';

const STORAGE_KEY = 'landit.widget.data';

export const saveWidgetData = async (data: WidgetData): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const loadWidgetData = async (): Promise<WidgetData | null> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;

  // 저장값이 깨진 건(JSON 아님·규격 불일치) 우리 쪽 결함 — 기록하고 기본 화면으로 그린다
  try {
    const result = widgetDataSchema.safeParse(JSON.parse(raw));
    if (result.success) return result.data;
    reportWarning(result.error);
  } catch (error) {
    reportWarning(error);
  }
  return null;
};
