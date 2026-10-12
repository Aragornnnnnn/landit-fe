// 시나리오 대화를 끝낸 순간 받은 금액을 보여 줄지 정하는 규칙의 계약 테스트
import { describe, expect, it } from 'vitest';

import { completionEarnOf, earnBaseOf } from './completion-earn';
import { earnedRewardToday, rewardView } from './reward.fixture';

// 오늘의 시나리오를 끝내 오늘 몫을 받은 뒤
const afterScenario = rewardView({ today: earnedRewardToday() });

describe('earnBaseOf', () => {
  it('오늘 몫이 아직이면 이번 완료로 받을 수 있다고 적어 둔다', () => {
    expect(earnBaseOf(rewardView())).toEqual({ date: '2026-10-10' });
  });

  it('오늘 몫을 이미 받았으면 적지 않는다 — 하루에 한 번만 쌓인다', () => {
    expect(earnBaseOf(afterScenario)).toBeNull();
  });

  it('쌓는 중이 아니면 적지 않는다', () => {
    expect(earnBaseOf(rewardView({ state: 'REVIEW', today: null }))).toBeNull();
  });
});

describe('completionEarnOf', () => {
  const base = { date: '2026-10-10' };

  it('이번 완료로 받은 금액을 알려 준다', () => {
    expect(completionEarnOf(afterScenario, base)).toEqual({ earnedWon: 500 });
  });

  it('적어 둔 것이 없으면 보여 줄 것이 없다', () => {
    expect(completionEarnOf(afterScenario, null)).toBeNull();
  });

  it('환급과 상관없는 사람에게는 보여 줄 것이 없다', () => {
    expect(completionEarnOf(null, base)).toBeNull();
  });

  it('새 금액이 아직 오지 않았으면 보여 줄 것이 없다', () => {
    // given — 받아 둔 답이 완료 전의 것이다
    expect(completionEarnOf(rewardView(), base)).toBeNull();
  });

  it('그사이 날이 바뀌었으면 보여 줄 것이 없다', () => {
    expect(completionEarnOf(afterScenario, { date: '2026-10-09' })).toBeNull();
  });
});
