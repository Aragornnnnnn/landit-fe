// 알람 링크 — Android "대화하러 가기" 버튼이 이 링크로 앱을 열고, 링크에 실린 종류와 갈 화면을 그대로 쓴다
import {
  alarmTypeSchema,
  repeatingAlarmSchema,
  type AlarmType,
} from '@landit/bridge';

const ALARM_LINK = 'landit://alarm';

// 알람을 걸 때 종류와 갈 화면을 링크에 싣는다 — id로 찾지 않아서 알람을 다시 걸어 id가 바뀌어도 괜찮다.
// 라이브러리가 뒤에 붙이는 alarmId는 쓰지 않는다
export const alarmLaunchUri = (alarmType: AlarmType, path: string) =>
  `${ALARM_LINK}?type=${alarmType}&path=${encodeURIComponent(path)}`;

export const isAlarmLink = (url: string) =>
  url
    .replace(/^[^:]+:\/*/, '') // 스킴을 뗀다 (슬래시 1개·2개 모두)
    .split(/[?#]/)[0] === 'alarm';

// 링크에서 값 하나를 꺼낸다. 리액트 네이티브엔 URLSearchParams.get이 없어 직접 찾고, 풀 수 없는 글자면 null
const queryValue = (url: string, key: string) => {
  const match = new RegExp(`[?&]${key}=([^&#]*)`).exec(url);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
};

// 알람 링크면 종류와 갈 화면, 아니면(다른 링크·망가진 링크) null
export const alarmEntryFromLink = (url: string | null | undefined) => {
  if (!url || !isAlarmLink(url)) return null;
  const alarmType = alarmTypeSchema.safeParse(queryValue(url, 'type'));
  const path = repeatingAlarmSchema.shape.path.safeParse(
    queryValue(url, 'path'),
  );
  if (!alarmType.success || !path.success) return null;
  return { alarmType: alarmType.data, path: path.data };
};
