// 타임라인 엔트리 조립 검증 — 네이티브가 거부하는 null이 새어 나가지 않는지가 핵심 계약
import { buildTimelineEntries } from './ios-props';

const dataOf = (over = {}) => ({
  streak: 5,
  todayDone: false,
  lastCompletedDate: '2026-08-26',
  todayCardTitle: '룸메이트와 첫인사',
  weeklyDone: [true, true, false, true, true, true, false],
  ...over,
});

const now = new Date('2026-08-27T15:00:00+09:00');

describe('buildTimelineEntries', () => {
  it('예약 시각마다 그 시각의 상태와 주간 스트립을 함께 싣는다', () => {
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
      todayCardTitle: '룸메이트와 첫인사',
    });
    expect(first.props.weekLabels).toHaveLength(7);
  });

  it('값이 없는 필드는 키 자체를 빼서 보낸다 — 네이티브 변환이 null을 거부한다', () => {
    const [first] = buildTimelineEntries({
      data: dataOf({ todayCardTitle: null }),
      now,
      artDir: null,
    });

    expect(first.props).not.toHaveProperty('artDir');
    expect(first.props).not.toHaveProperty('todayCardTitle');
    expect(first.props).not.toHaveProperty('milestone');
  });

  it('마일스톤 달성일에는 달성 숫자를 싣는다', () => {
    const [first] = buildTimelineEntries({
      data: dataOf({ streak: 14, lastCompletedDate: '2026-08-27' }),
      now,
      artDir: null,
    });

    expect(first.props).toMatchObject({ kind: 'milestone', milestone: 14 });
  });

  it('모든 엔트리가 같은 주간 스트립을 공유한다 — 창이 스냅샷 기준이라 시각별로 흔들리지 않는다', () => {
    const entries = buildTimelineEntries({ data: dataOf(), now, artDir: null });

    for (const entry of entries) {
      expect(entry.props.weekLabels).toEqual(entries[0].props.weekLabels);
    }
  });
});
