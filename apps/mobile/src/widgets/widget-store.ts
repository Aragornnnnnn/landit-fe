// 위젯 데이터 저장소 — 셸이 브릿지로 받은 데이터를 기록하고, 위젯 갱신 코드가 읽는다
import { widgetDataSchema, type WidgetData } from '@landit/bridge';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'landit.widget.data';

export const saveWidgetData = async (data: WidgetData): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const loadWidgetData = async (): Promise<WidgetData | null> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;

  try {
    const result = widgetDataSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
};
