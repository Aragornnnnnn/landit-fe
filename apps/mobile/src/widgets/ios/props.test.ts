// 타임라인 엔트리 조립 검증 — 네이티브가 거부하는 null이 새어 나가지 않는지가 핵심 계약
import { buildTimelineEntries } from './props';

const dataOf = (over = {}) => ({
  streak: 5,
  todayDone: false,
  lastCompletedDate: '2026-08-26',
  todayCardTitle: '룸메이트와 첫인사',
  weeklyDone: [true, true, false, true, true, true, false],
  capturedOn: '2026-08-27',
  ...over,
});

const now = new Date('2026-08-27T15:00:00+09:00');

describe('buildTimelineEntries', () => {
  it('엔트리를 만들면 시각마다 그 시각의 상태와 주간 스트립을 함께 싣는다', () => {
    const [first] = buildTimelineEntries({
      data: dataOf(),
      now,
      artDir: 'file:///art/',
    });

    expect(first.date).toEqual(now);
    expect(first.props).toMatchObject({
      kind: 'nudge',
      displayStreak: 5,
      artDir: 'file:///art/',
    });
    expect(first.props.weekLabels).toHaveLength(7);
  });

  it('값이 null이면 키 자체를 빼서 보낸다 — 네이티브 변환이 null을 거부한다', () => {
    const [first] = buildTimelineEntries({
      data: dataOf(),
      now,
      artDir: null,
    });

    expect(first.props).not.toHaveProperty('artDir');
    expect(first.props).not.toHaveProperty('milestone');
  });

  it('마일스톤 달성일이면 달성 숫자를 싣는다', () => {
    const [first] = buildTimelineEntries({
      data: dataOf({ streak: 14, lastCompletedDate: '2026-08-27' }),
      now,
      artDir: null,
    });

    expect(first.props).toMatchObject({ kind: 'milestone', milestone: 14 });
  });

  it('날이 바뀐 엔트리는 주간 창도 그 날짜로 민다 — 라벨과 열매가 항상 짝이 맞는다', () => {
    const entries = buildTimelineEntries({ data: dataOf(), now, artDir: null });

    const tomorrow = entries.find(
      (e) =>
        e.date.getTime() >= new Date('2026-08-28T00:00:00+09:00').getTime(),
    );
    // 오늘(목)로 끝나던 창이 내일 엔트리에서는 금으로 끝난다
    expect((entries[0].props.weekLabels as string[]).at(-1)).toBe('목');
    expect((tomorrow?.props.weekLabels as string[]).at(-1)).toBe('금');
    // 새로 생긴 날은 미완료다 — 앱을 안 열면 완료했을 리 없다
    expect((tomorrow?.props.weekDone as boolean[]).at(-1)).toBe(false);
  });
});
