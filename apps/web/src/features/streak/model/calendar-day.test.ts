// 달력 칸 상태와 이어진 구간(띠) 계산의 계약 테스트
import { describe, expect, it } from 'vitest';

import { markOf, runsOf } from './calendar-day';

const context = {
  today: '2026-08-03',
  activeDates: new Set(['2026-08-01', '2026-08-02', '2026-08-03']),
  firstRecordDate: '2026-07-20',
};

describe('markOf', () => {
  it('완료한 날이면 도장을 찍는다', () => {
    expect(markOf('2026-08-02', context)).toBe('done');
  });

  it('지나갔는데 비어 있으면 놓친 날이다', () => {
    expect(markOf('2026-07-25', context)).toBe('missed');
  });

  it('오늘이 아직 비어 있으면 놓친 날로 단정하지 않는다', () => {
    // given — 오늘은 아직 끝나지 않아 만회할 수 있다
    const pending = { ...context, activeDates: new Set(['2026-08-01']) };

    // when + then
    expect(markOf('2026-08-03', pending)).toBe('today');
  });

  it('아직 오지 않은 날은 비워 둔다', () => {
    expect(markOf('2026-08-10', context)).toBe('blank');
  });

  it('첫 기록보다 앞선 날은 비워 둔다', () => {
    // given — 7월 20일이 첫 완료일이라 그 앞은 놓친 게 아니라 기록 자체가 없다

    // when + then
    expect(markOf('2026-07-19', context)).toBe('blank');
  });

  it('기록이 하나도 없으면 지난 날도 비워 둔다', () => {
    // given — 신규 유저
    const fresh = {
      today: '2026-08-03',
      activeDates: new Set<string>(),
      firstRecordDate: null,
    };

    // when + then — 놓친 날 동그라미로 도배하지 않는다
    expect(markOf('2026-07-19', fresh)).toBe('blank');
  });
});

describe('runsOf', () => {
  const week = [
    '2026-08-02',
    '2026-08-03',
    '2026-08-04',
    '2026-08-05',
    '2026-08-06',
    '2026-08-07',
    '2026-08-08',
  ];

  it('이어진 날들을 하나의 구간으로 묶는다', () => {
    // given — 3일·4일·5일이 이어졌다
    const active = new Set(['2026-08-03', '2026-08-04', '2026-08-05']);

    // when
    const runs = runsOf(week, active);

    // then — 띠 하나가 두 번째 칸부터 세 칸을 덮는다
    expect(runs).toEqual([{ start: 1, length: 3 }]);
  });

  it('하루만 완료한 날도 구간이 된다', () => {
    // given — 4일만 완료. 시안은 하루짜리에도 알약을 그린다

    // when + then
    expect(runsOf(week, new Set(['2026-08-04']))).toEqual([
      { start: 2, length: 1 },
    ]);
  });

  it('비어 있는 날에서 구간을 끊는다', () => {
    // given — 3일과 5일만 완료돼 4일이 비었다

    // when
    const runs = runsOf(week, new Set(['2026-08-03', '2026-08-05']));

    // then — 빈 4일을 가로질러 이어 보이면 거짓말이 된다
    expect(runs).toEqual([
      { start: 1, length: 1 },
      { start: 3, length: 1 },
    ]);
  });

  it('주 행 끝에서 구간을 닫는다', () => {
    // given — 7일·8일(행의 마지막 두 칸)이 이어졌다

    // when + then — 다음 주로 넘어가는 띠는 그리지 않는다
    expect(runsOf(week, new Set(['2026-08-07', '2026-08-08']))).toEqual([
      { start: 5, length: 2 },
    ]);
  });

  it('달 바깥의 빈 칸은 구간에 넣지 않는다', () => {
    // given — 앞이 비어 있는 첫 주
    const firstWeek = [null, null, null, null, null, null, '2026-08-01'];

    // when + then
    expect(runsOf(firstWeek, new Set(['2026-08-01']))).toEqual([
      { start: 6, length: 1 },
    ]);
  });

  it('완료한 날이 없으면 구간도 없다', () => {
    expect(runsOf(week, new Set<string>())).toEqual([]);
  });
});
