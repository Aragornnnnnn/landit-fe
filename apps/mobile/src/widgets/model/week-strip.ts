// 주간 스트립 데이터 — 오늘(서울)로 끝나는 7칸의 요일 라벨과 완료 여부를 만든다.
// weeklyDone은 기준일(capturedOn)로 끝나는 7일의 기록이다. 날이 지났으면 창을 오늘까지 민다 —
// 완료는 앱 안에서만 일어나므로, 앱을 안 연 날은 완료했을 리 없어 미완료로 확정할 수 있다
import type { ShellLocale } from '../../i18n/shell-locale';
import { SHELL_MESSAGES } from '../../i18n/shell-messages';
import { seoulClock, seoulWeekday } from './seoul-date';

const daysBetween = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      (24 * 60 * 60 * 1000),
  );

export const buildWeekStrip = ({
  locale,
  weeklyDone,
  capturedOn,
  now,
}: {
  // 요일 이름의 언어 — 셸 언어(웹 화면 언어)
  locale: ShellLocale;
  weeklyDone: boolean[];
  capturedOn: string | null;
  now: Date;
}): { labels: string[]; done: boolean[] } => {
  const today = seoulWeekday(now);
  // 오늘로 끝나는 7일 창의 첫 칸은 6일 전 = 요일로는 내일과 같다
  const { weekdays } = SHELL_MESSAGES[locale];
  const labels = Array.from(
    { length: 7 },
    (_, i) => weekdays[(today + 1 + i) % 7],
  );

  // 기준일이 없으면(로그인 전) 보여줄 기록이 없다
  const elapsed =
    capturedOn === null ? 7 : daysBetween(capturedOn, seoulClock(now).date);
  // 지난 날만큼 창을 민다 — 앞은 창 밖으로 버리고, 안 연 날은 미완료로 채운다
  const done = Array.from({ length: 7 }, (_, i) => {
    const source = i + elapsed;
    return source < 7 ? weeklyDone[source] : false;
  });
  return { labels, done };
};
