// 튜토리얼 타이핑 진행 — 한 자씩 쓰고, 다 쓴 문장을 누르면 지우고 다음 문장으로
import { describe, expect, it } from 'vitest';

import {
  INITIAL_TYPING,
  revealTyping,
  tapTyping,
  tickTyping,
  type TypingState,
} from './tutorial-typing';

const LENGTHS = [3, 2];

describe('tickTyping', () => {
  it('쓰는 중이면 한 자씩 늘고, 다 쓰면 멈춰서 기다린다', () => {
    let state = INITIAL_TYPING;
    state = tickTyping(state, LENGTHS);
    expect(state).toEqual({ index: 0, count: 1, phase: 'typing' });
    state = tickTyping(tickTyping(state, LENGTHS), LENGTHS);
    expect(state).toEqual({ index: 0, count: 3, phase: 'shown' });
    expect(tickTyping(state, LENGTHS)).toBe(state);
  });

  it('지우는 중이면 줄어들고, 다 지우면 다음 문장을 쓰기 시작한다', () => {
    let state: TypingState = { index: 0, count: 1, phase: 'erasing' };
    state = tickTyping(state, LENGTHS);
    expect(state).toEqual({ index: 1, count: 0, phase: 'typing' });
  });
});

describe('tapTyping', () => {
  it('쓰는 중에는 누름을 무시한다 — 연타로 문장을 건너뛰지 못하게', () => {
    const typing: TypingState = { index: 0, count: 1, phase: 'typing' };
    expect(tapTyping(typing, LENGTHS)).toBe(typing);
  });

  it('다 쓴 문장에서 누르면 지우기 시작한다', () => {
    expect(tapTyping({ index: 0, count: 3, phase: 'shown' }, LENGTHS)).toEqual({
      index: 0,
      count: 3,
      phase: 'erasing',
    });
  });

  it('마지막 문장을 다 쓴 뒤에는 눌러도 그대로다 — 버튼으로 넘어간다', () => {
    const last: TypingState = { index: 1, count: 2, phase: 'shown' };
    expect(tapTyping(last, LENGTHS)).toBe(last);
  });

  it('지우는 중에는 누름을 무시한다', () => {
    const erasing: TypingState = { index: 0, count: 2, phase: 'erasing' };
    expect(tapTyping(erasing, LENGTHS)).toBe(erasing);
  });
});

describe('revealTyping', () => {
  it('쓰는 중인 문장을 끝까지 한 번에 보여 준다', () => {
    expect(
      revealTyping({ index: 0, count: 1, phase: 'typing' }, LENGTHS),
    ).toEqual({ index: 0, count: 3, phase: 'shown' });
  });
});
