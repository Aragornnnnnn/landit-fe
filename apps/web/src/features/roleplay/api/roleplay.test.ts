// 롤플레이 가짜 저장소 검증 — API가 붙기 전까지 화면이 기대는 동작(만들기·목록 순서·삭제)을 지킨다
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 저장소는 모듈 변수라 테스트마다 모듈을 새로 불러 처음 상태에서 시작한다
const fresh = async () => {
  vi.resetModules();
  return import('./roleplay');
};

// 가짜 지연을 흘려보내고 결과를 받는다
const settle = async <T>(promise: Promise<T>) => {
  await vi.runAllTimersAsync();
  return promise;
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 31, 15, 0, 0));
});

afterEach(() => vi.useRealTimers());

describe('롤플레이 가짜 저장소', () => {
  it('만든 시나리오는 방금 대화한 것이라 목록 맨 위에 선다', async () => {
    const api = await fresh();

    const created = await settle(
      api.createRoleplayScenario({
        partner: 'teddy',
        myRole: '여행객',
        partnerRole: '호텔 직원',
        situation: '방을 바꿔 달라고 하기',
      }),
    );
    const list = await settle(api.getRoleplayScenarios());

    expect(list[0]).toEqual(created);
    expect(created.lastTalkedAt.startsWith('2026-10-31')).toBe(true);
  });

  it('목록은 마지막 대화가 최근인 순서다', async () => {
    const api = await fresh();

    const list = await settle(api.getRoleplayScenarios());

    const times = list.map((scenario) => scenario.lastTalkedAt);
    expect(times).toEqual([...times].sort().reverse());
  });

  it('지운 시나리오는 목록에서 빠진다', async () => {
    const api = await fresh();
    const [first] = await settle(api.getRoleplayScenarios());

    await settle(api.deleteRoleplayScenario(first.scenarioId));
    const list = await settle(api.getRoleplayScenarios());

    expect(list.map((scenario) => scenario.scenarioId)).not.toContain(
      first.scenarioId,
    );
  });

  it('아이디어는 세 칸을 한 조합으로 채운다', async () => {
    const api = await fresh();

    const idea = await settle(api.getRoleplayIdea());

    expect(idea.myRole && idea.partnerRole && idea.situation).toBeTruthy();
  });
});
