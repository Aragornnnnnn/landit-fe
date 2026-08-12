// 발화 시간 표기 규칙 검증 — 서버가 밀리초로 주는 값을 사람이 읽는 문장으로 바꾼다
import { describe, expect, it } from 'vitest';

import { toSpeakingTimeLabel } from './speaking-time';

describe('toSpeakingTimeLabel', () => {
  it('1분이 안 되면 초만 말한다', () => {
    // Given 남은 시간이 30초일 때
    // When 표기를 만들면
    // Then 분을 붙이지 않는다 — "0분 30초"는 남은 게 적다는 인상을 흐린다
    expect(toSpeakingTimeLabel(30_000)).toBe('30초');
  });

  it('1분이 넘으면 분과 초를 함께 말한다', () => {
    expect(toSpeakingTimeLabel(161_000)).toBe('2분 41초');
  });

  it('초가 딱 떨어지면 분만 말한다', () => {
    // 남은 시간이 정확히 3분일 때 "3분 0초"라고 하지 않는다
    expect(toSpeakingTimeLabel(180_000)).toBe('3분');
  });

  it('1초 미만은 버려서 초 단위로 맞춘다', () => {
    // 서버 누적값은 밀리초라 잔여가 애매하게 남는다 — 내림해야 한도를 넘겨 보이지 않는다
    expect(toSpeakingTimeLabel(30_900)).toBe('30초');
  });

  it('남은 시간이 없으면 0초라고 말한다', () => {
    expect(toSpeakingTimeLabel(0)).toBe('0초');
  });

  it('음수가 와도 0초로 막는다', () => {
    // 서버가 초과분을 음수로 줄 수 있다 — 화면에 "-3초"가 뜨면 안 된다
    expect(toSpeakingTimeLabel(-5_000)).toBe('0초');
  });
});
