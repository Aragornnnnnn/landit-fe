// 대화 완료 축하 모먼트의 계약 테스트 — 도장을 찍을지, 뭐라고 말할지
import { describe, expect, it } from 'vitest';

import { celebrationOf } from './celebration';

describe('celebrationOf — 도장', () => {
  it('들어갈 때 오늘이 아직이었으면 도장을 찍는다', () => {
    // given — 어제까지 5일이었고 방금 오늘 것을 채웠다
    const celebration = celebrationOf({
      currentStreakDays: 6,
      base: { activeToday: false },
    });

    expect(celebration.stamping).toBe(true);
  });

  it('들어갈 때 이미 오늘을 채웠었으면 도장을 찍지 않는다', () => {
    // given — 같은 날 두 번째 대화. 열매가 새로 붙지 않았는데 찍히면 거짓말이 된다
    const celebration = celebrationOf({
      currentStreakDays: 6,
      base: { activeToday: true },
    });

    expect(celebration.stamping).toBe(false);
  });

  it('집어둔 값이 없으면 도장 없이 지금 상태만 보여준다', () => {
    // given — 홈을 안 거치고 바로 대화로 들어온 경우. 틀린 연출보다 없는 연출이 낫다
    const celebration = celebrationOf({ currentStreakDays: 6, base: null });

    expect(celebration.stamping).toBe(false);
  });
});

describe('celebrationOf — 문구', () => {
  it('하루째면 다음 목표로 한 주를 가리킨다', () => {
    const celebration = celebrationOf({
      currentStreakDays: 1,
      base: { activeToday: false },
    });

    expect(celebration.title).toBe('오늘 열매를 채웠어요');
    expect(celebration.guide).toBe('내일도 이어가서 한 주를 채워봐요');
  });

  it('완료한 날이 오늘뿐이면 첫 열매라고 말한다', () => {
    // given — 이력을 통틀어 오늘 하루. 래디가 첫 열매를 먹는 화면이 뜬다
    const celebration = celebrationOf({
      currentStreakDays: 1,
      base: { activeToday: false },
      totalActiveDays: 1,
    });

    expect(celebration.first).toBe(true);
    expect(celebration.title).toBe('첫 열매예요!');
    expect(celebration.guide).toBe('내일도 이어가서 한 주를 채워봐요');
  });

  it('예전에 완료한 날이 있으면 하루째여도 첫 열매가 아니다', () => {
    // given — 끊겼다 오늘 다시 붙은 1일. 첫 열매라고 하면 지난 기록을 없던 일로 만든다
    const celebration = celebrationOf({
      currentStreakDays: 1,
      base: { activeToday: false },
      totalActiveDays: 9,
    });

    expect(celebration.first).toBe(false);
    expect(celebration.title).toBe('오늘 열매를 채웠어요');
  });

  it('총 완료를 모르면 첫 열매라고 단정하지 않는다', () => {
    // given — 달력을 아직 못 받은 경우. 틀린 축하보다 밋밋한 축하가 낫다
    const celebration = celebrationOf({
      currentStreakDays: 1,
      base: null,
    });

    expect(celebration.first).toBe(false);
  });

  it('이어가는 중이면 다음 고비까지 남은 날을 말한다', () => {
    // given — 나흘째. 제목이 이미 며칟날인지 말하니 안내는 다음 목표를 가리킨다
    const celebration = celebrationOf({
      currentStreakDays: 4,
      base: { activeToday: false },
    });

    expect(celebration.title).toBe('4일 연속');
    expect(celebration.guide).toBe('한 주 연속까지 3일 남았어요');
  });

  it('한 주를 넘기면 목표가 내 최고 기록이 된다', () => {
    // given — 8일째인데 예전에 20일까지 간 적이 있다. 한 달·백 일보다 내 기록이 가깝다
    const celebration = celebrationOf({
      currentStreakDays: 8,
      base: { activeToday: false },
      longestStreakDays: 20,
    });

    expect(celebration.guide).toBe('최고 기록까지 12일 남았어요');
  });

  it('최고 기록에 닿아 있으면 지금 갱신하는 중이라고 말한다', () => {
    // given — 계속 이어가는 사람은 서버가 주는 최고 기록이 오늘 것까지 반영돼 현재와 같다
    const celebration = celebrationOf({
      currentStreakDays: 12,
      base: { activeToday: false },
      longestStreakDays: 12,
    });

    expect(celebration.guide).toBe('최고 기록을 새로 쓰는 중이에요');
  });

  it('최고 기록을 모르면 목표를 지어내지 않는다', () => {
    // given — 달력을 아직 못 받았다
    const celebration = celebrationOf({
      currentStreakDays: 12,
      base: { activeToday: false },
    });

    expect(celebration.guide).toBe('12일째 이어가고 있어요');
  });

  it('예전 기록이 아득히 멀면 목표로 걸지 않는다', () => {
    // given — 8일째인데 예전 최고가 180일. 172일 남았다는 말은 목표가 아니라 벽이다
    const celebration = celebrationOf({
      currentStreakDays: 8,
      base: { activeToday: false },
      longestStreakDays: 180,
    });

    expect(celebration.guide).toBe('8일째 이어가고 있어요');
  });

  it.each([
    [7, '일주일 연속! 이 기세면 원어민 실력도 시간 문제예요'],
    [30, '한 달을 채웠어요! 꾸준히 하는 모습이 멋져요'],
    [100, '백 일 동안 하루도 안 빠졌어요! 정말 멋져요'],
  ])('%i일째를 채운 날엔 그날만의 축하를 건넨다', (days, guide) => {
    const celebration = celebrationOf({
      currentStreakDays: days,
      base: { activeToday: false },
    });

    expect(celebration.title).toBe(`${days}일 연속`);
    expect(celebration.guide).toBe(guide);
  });

  it('고비를 지난 날엔 축하를 물린다', () => {
    // given — 8일째. 7일 축하는 어제 이미 했다
    const celebration = celebrationOf({
      currentStreakDays: 8,
      base: { activeToday: false },
    });

    expect(celebration.guide).not.toBe(
      '일주일 연속! 이 기세면 원어민 실력도 시간 문제예요',
    );
  });
});
