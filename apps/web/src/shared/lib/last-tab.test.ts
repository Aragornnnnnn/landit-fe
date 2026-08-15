// 마지막 탭 기억 규칙 검증 — 탭 주소만 기억하고, 기억이 없거나 이상하면 시나리오 탭이 정본이다
import { describe, expect, it } from 'vitest';

import { resolveHomePath, toRememberedTab } from './last-tab';
import { SCENARIO_PATH, SMALLTALK_PATH } from './routes';

describe('toRememberedTab', () => {
  it('탭 최상위 주소면 그대로 기억한다', () => {
    expect(toRememberedTab(SMALLTALK_PATH)).toBe(SMALLTALK_PATH);
    expect(toRememberedTab(SCENARIO_PATH)).toBe(SCENARIO_PATH);
  });

  it('탭이 아닌 주소는 기억하지 않는다 — 스트릭이나 편지함이 "돌아갈 곳"이 되면 안 된다', () => {
    expect(toRememberedTab('/streak')).toBeNull();
    expect(toRememberedTab('/mailbox')).toBeNull();
    expect(toRememberedTab('/scenario?date=2026-08-01')).toBeNull();
  });
});

describe('resolveHomePath', () => {
  it('기억한 탭이 있으면 그리로 돌아간다', () => {
    expect(resolveHomePath(SMALLTALK_PATH)).toBe(SMALLTALK_PATH);
  });

  it('기억이 없거나 모르는 값이면 시나리오 탭이다', () => {
    expect(resolveHomePath(null)).toBe(SCENARIO_PATH);
    expect(resolveHomePath('/whatever')).toBe(SCENARIO_PATH);
  });
});
