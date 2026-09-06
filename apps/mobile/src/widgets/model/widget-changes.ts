// 위젯 추가·삭제 기록 — 프로바이더 콜백(헤드리스일 수 있다)이 쌓고, 셸이 웹이 청할 때 비워 보낸다.
// 레코드마다 키를 따로 둔다 — 한 키에 목록을 넣으면 헤드리스 쌓기와 셸 비우기가 서로의 읽고-쓰기 사이에 끼어들어
// 새 레코드를 지우거나 같은 레코드를 두 번 보낼 수 있다. 키가 다르면 쌓기는 서로 안 겹치고, 비우기는 읽은 키만 지운다.
// 앱이 살아 있을 때 들어온 건은 즉시 알려 셸이 바로 보낼 수 있게 한다
import {
  widgetChangeSchema,
  widgetFamilySchema,
  type WidgetChange,
  type WidgetFamily,
} from '@landit/bridge';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'landit.widget.change.';

export interface WidgetChangeRecord {
  change: WidgetChange;
  family: WidgetFamily;
}

// 브릿지 어휘로 검증한다 — 값 둘 다 규격 안이어야 레코드로 친다
const parseRecord = (raw: string): WidgetChangeRecord | null => {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { change, family } = parsed as Record<string, unknown>;
    const changeResult = widgetChangeSchema.safeParse(change);
    const familyResult = widgetFamilySchema.safeParse(family);
    if (!changeResult.success || !familyResult.success) return null;
    return { change: changeResult.data, family: familyResult.data };
  } catch {
    return null;
  }
};

type Listener = () => void;
const listeners = new Set<Listener>();

// 키 순서가 곧 시간 순서다. 같은 밀리초에 여러 건이 와도 같은 런타임 안에선 순번으로 순서를 지키고,
// 다른 런타임(헤드리스)과 겹칠 때만 난수로 키 충돌을 피한다
let sequence = 0;
const nextKey = () =>
  `${KEY_PREFIX}${Date.now().toString().padStart(13, '0')}-${(sequence++).toString().padStart(4, '0')}-${Math.random().toString(36).slice(2, 6)}`;

// 쌓고 알린다 — 같은 프로세스에 셸이 떠 있으면 구독자가 바로 비워 간다
export const recordWidgetChange = async (
  record: WidgetChangeRecord,
): Promise<void> => {
  await AsyncStorage.setItem(nextKey(), JSON.stringify(record));
  listeners.forEach((listener) => listener());
};

// 비우기가 겹치지 않게 한 번에 하나만 돈다 — 두 트리거(웹 요청·복귀)가 같은 키를 읽어 두 번 보내는 걸 막는다
let draining: Promise<WidgetChangeRecord[]> | null = null;

const drainOnce = async (): Promise<WidgetChangeRecord[]> => {
  const keys = (await AsyncStorage.getAllKeys())
    .filter((key) => key.startsWith(KEY_PREFIX))
    .sort();
  if (keys.length === 0) return [];

  const entries = await AsyncStorage.multiGet(keys);
  // 읽은 키만 지운다 — 그 사이 새로 쌓인 레코드는 다음 비우기 몫이다
  await AsyncStorage.multiRemove(keys);

  // 규격 밖·깨진 레코드는 버린다 — 이벤트 속성 타입이 어긋난 채 나가지 않게
  return entries.flatMap(([, raw]) => {
    const record = raw === null ? null : parseRecord(raw);
    return record === null ? [] : [record];
  });
};

// 쌓인 것을 전부 꺼내고 비운다 — 꺼낸 쪽이 보낼 책임을 진다
export const drainWidgetChanges = (): Promise<WidgetChangeRecord[]> => {
  if (draining === null) {
    draining = drainOnce().finally(() => {
      draining = null;
    });
  }
  return draining;
};

export const subscribeWidgetChanges = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
