// 마지막 탭 기억 규칙 검증 — 탭 주소만 기억하고, 기억이 없거나 이상하면 시나리오 탭이 정본이다
import { describe, expect, it, vi } from 'vitest';

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

// 기억은 모듈 변수라 테스트마다 모듈을 새로 불러 초기 상태에서 시작한다
describe('rememberTab → homePath', () => {
  const fresh = async () => {
    vi.resetModules();
    return import('./last-tab');
  };

  it('아무것도 기억하기 전엔 시나리오 탭이다', async () => {
    const { homePath } = await fresh();

    expect(homePath()).toBe(SCENARIO_PATH);
  });

  it('탭을 보고 있었으면 그 탭으로 돌아간다', async () => {
    const { rememberTab, homePath } = await fresh();

    rememberTab(SMALLTALK_PATH);

    expect(homePath()).toBe(SMALLTALK_PATH);
  });

  it('탭이 아닌 화면을 지나가도 마지막 탭은 그대로다 — 스몰톡에서 편지함으로 갔다 와도 스몰톡이다', async () => {
    const { rememberTab, homePath } = await fresh();

    rememberTab(SMALLTALK_PATH);
    rememberTab('/mailbox');
    rememberTab('/mailbox/received/3');

    expect(homePath()).toBe(SMALLTALK_PATH);
  });

  it('탭을 옮기면 기억도 옮겨 간다', async () => {
    const { rememberTab, homePath } = await fresh();

    rememberTab(SMALLTALK_PATH);
    rememberTab(SCENARIO_PATH);

    expect(homePath()).toBe(SCENARIO_PATH);
  });
});
