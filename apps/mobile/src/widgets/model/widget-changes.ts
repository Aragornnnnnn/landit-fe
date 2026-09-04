// 위젯 추가·삭제 기록 — 프로바이더 콜백(헤드리스일 수 있다)이 쌓고, 셸이 웹이 청할 때 비워 보낸다.
// 앱이 살아 있을 때 들어온 건은 즉시 알려 셸이 바로 보낼 수 있게 한다
import type { WidgetChange, WidgetFamily } from '@landit/bridge';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'landit.widget.changes';

export interface WidgetChangeRecord {
  change: WidgetChange;
  family: WidgetFamily;
}

type Listener = () => void;
const listeners = new Set<Listener>();

const load = async (): Promise<WidgetChangeRecord[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WidgetChangeRecord[]) : [];
  } catch {
    return [];
  }
};

// 쌓고 알린다 — 같은 프로세스에 셸이 떠 있으면 구독자가 바로 비워 간다
export const recordWidgetChange = async (
  record: WidgetChangeRecord,
): Promise<void> => {
  const pending = await load();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...pending, record]));
  listeners.forEach((listener) => listener());
};

// 쌓인 것을 전부 꺼내고 비운다 — 꺼낸 쪽이 보낼 책임을 진다
export const drainWidgetChanges = async (): Promise<WidgetChangeRecord[]> => {
  const pending = await load();
  if (pending.length > 0) await AsyncStorage.removeItem(STORAGE_KEY);
  return pending;
};

export const subscribeWidgetChanges = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
