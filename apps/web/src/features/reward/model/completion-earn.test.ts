// 시나리오 대화를 끝낸 순간 받은 금액을 보여 줄지 정하는 규칙의 계약 테스트
import { describe, expect, it } from 'vitest';

import { completionEarnOf } from './completion-earn';
import { rewardCompletion } from './reward.fixture';

describe('completionEarnOf', () => {
  it('영수증에 적힌, 이번 완료로 받은 금액을 알려 준다', () => {
    expect(completionEarnOf(rewardCompletion())).toEqual({ earnedWon: 500 });
  });

  it('자정 전에 시작해 넘겨 끝내 전날 몫으로 쌓였어도 받은 금액을 알려 준다', () => {
    // given — 10/10 23:58에 시작해 10/11 00:03에 끝냈다. 서버는 시작한 날 몫으로 쳐 준다
    const receipt = rewardCompletion({ learningDate: '2026-10-10' });

    expect(completionEarnOf(receipt)).toEqual({ earnedWon: 500 });
  });

  it('영수증이 없으면 보여 줄 것이 없다', () => {
    expect(completionEarnOf(undefined)).toBeNull();
  });

  it('이번 완료로 더 쌓인 것이 없으면 보여 줄 것이 없다 — 같은 날 두 번째 대화', () => {
    const receipt = rewardCompletion({
      status: 'NO_ADDITIONAL_REWARD',
      earnedWon: 0,
    });

    expect(completionEarnOf(receipt)).toBeNull();
  });

  it('금액이 아직 정해지지 않았으면 보여 줄 것이 없다', () => {
    const receipt = rewardCompletion({ status: 'PENDING', earnedWon: null });

    expect(completionEarnOf(receipt)).toBeNull();
  });
});
