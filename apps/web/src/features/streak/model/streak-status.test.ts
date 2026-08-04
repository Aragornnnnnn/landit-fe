// 스트릭 전체 상태(열매 모양·안내 문구)의 계약 테스트
import { describe, expect, it } from 'vitest';

import { fruitStateOf, heroMessageOf } from './streak-status';

describe('fruitStateOf', () => {
  it('오늘까지 이어졌으면 열매가 싱싱하다', () => {
    expect(fruitStateOf({ currentStreakDays: 7, activeToday: true })).toBe(
      'fresh',
    );
  });

  it('이어지는 중인데 오늘이 아직이면 열매가 흐려진다', () => {
    // given — 어제까지 6일. 아직 오늘을 놓친 건 아니다
    expect(fruitStateOf({ currentStreakDays: 6, activeToday: false })).toBe(
      'faded',
    );
  });

  it('0일이면 빈 열매가 된다', () => {
    expect(fruitStateOf({ currentStreakDays: 0, activeToday: false })).toBe(
      'empty',
    );
  });
});

describe('heroMessageOf', () => {
  it('오늘이 아직이면 오늘 끝내서 하루를 더하라고 안내한다', () => {
    // given — 어제까지 6일 이어진 상태

    // when
    const message = heroMessageOf({
      currentStreakDays: 6,
      activeToday: false,
      totalActiveDays: 20,
    });

    // then
    expect(message.title).toBe('6일 연속 학습');
    expect(message.guide).toBe('오늘 대화를 끝내면 7일이 돼요');
  });

  it('오늘을 이미 끝냈으면 내일을 가리킨다', () => {
    // given — 오늘까지 5일. 오늘 걸 또 하라고 하면 틀린 말이 된다

    // when
    const message = heroMessageOf({
      currentStreakDays: 5,
      activeToday: true,
      totalActiveDays: 20,
    });

    // then
    expect(message.title).toBe('5일 연속 학습');
    expect(message.guide).toBe('내일도 이어가면 6일이 돼요');
  });

  it('기록은 있는데 끊겼으면 0일로 적고 오늘 하면 되는 것을 알린다', () => {
    // given — 완료한 날은 20일 있지만 연속은 끊겼다

    // when
    const message = heroMessageOf({
      currentStreakDays: 0,
      activeToday: false,
      totalActiveDays: 20,
    });

    // then
    expect(message.title).toBe('0일 연속 학습');
    expect(message.guide).toBe('오늘 대화 하나면 다시 1일이에요');
  });

  it.each([
    [7, '일주일을 꽉 채웠어요!'],
    [30, '한 달을 꽉 채웠어요!'],
    [100, '백 일째 이어가고 있어요'],
  ])('오늘 %i일째를 채우면 고비를 축하한다', (days, guide) => {
    // given — 오늘치를 채워 그 수에 막 도달했다

    // when
    const message = heroMessageOf({
      currentStreakDays: days,
      activeToday: true,
      totalActiveDays: days,
    });

    // then — 제목은 그대로 두고 안내만 바뀐다
    expect(message.title).toBe(`${days}일 연속 학습`);
    expect(message.guide).toBe(guide);
  });

  it('고비 수여도 오늘이 아직이면 축하하지 않는다', () => {
    // given — 어제 7일째를 채웠고 오늘은 아직. 어제 축하를 오늘 또 하면 김빠진다

    // when
    const message = heroMessageOf({
      currentStreakDays: 7,
      activeToday: false,
      totalActiveDays: 20,
    });

    // then — 평소처럼 오늘을 가리킨다
    expect(message.guide).toBe('오늘 대화를 끝내면 8일이 돼요');
  });

  it('고비를 지나면 축하를 물린다', () => {
    // given — 오늘까지 8일. 7일 축하는 어제 이미 했다

    // when + then
    expect(
      heroMessageOf({
        currentStreakDays: 8,
        activeToday: true,
        totalActiveDays: 20,
      }).guide,
    ).toBe('내일도 이어가면 9일이 돼요');
  });

  it('기록이 아예 없으면 첫 열매를 모으라고 안내한다', () => {
    // given — 완료한 날이 하나도 없는 신규 유저

    // when
    const message = heroMessageOf({
      currentStreakDays: 0,
      activeToday: false,
      totalActiveDays: 0,
    });

    // then
    expect(message.title).toBe('아직 열매가 없어요');
    expect(message.guide).toBe('오늘 첫 대화로 열매를 모아봐요');
  });
});
