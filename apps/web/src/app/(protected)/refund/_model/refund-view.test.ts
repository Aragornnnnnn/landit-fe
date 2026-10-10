// 환급 화면이 무엇을 그릴지의 계약 테스트
import { describe, expect, it } from 'vitest';

import { rewardView } from '@/features/reward/model/reward.fixture';

import { refundViewOf } from './refund-view';

const base = {
  reward: null,
  error: null,
  loaded: false,
  invited: false,
  settled: false,
};
const failure = new Error('네트워크 오류');

describe('refundViewOf', () => {
  it('참여자에게는 환급 기록을 보여 준다', () => {
    const reward = rewardView();

    expect(refundViewOf({ ...base, reward, loaded: true })).toEqual({
      kind: 'record',
      reward,
    });
  });

  it('참여자는 다시 받기가 실패해도 가진 기록을 본다', () => {
    const view = refundViewOf({
      ...base,
      reward: rewardView(),
      loaded: true,
      error: failure,
    });

    expect(view.kind).toBe('record');
  });

  it('환급을 한 번도 받지 못했으면 다시 시도를 권한다', () => {
    expect(refundViewOf({ ...base, error: failure })).toEqual({
      kind: 'error',
      error: failure,
    });
  });

  it('권할 사람에게는 환급 소개를 보여 준다', () => {
    const view = refundViewOf({
      ...base,
      loaded: true,
      invited: true,
      settled: true,
    });

    expect(view.kind).toBe('intro');
  });

  it('권할 사람은 다시 받기가 실패해도 소개를 본다', () => {
    const view = refundViewOf({
      ...base,
      loaded: true,
      invited: true,
      settled: true,
      error: failure,
    });

    expect(view.kind).toBe('intro');
  });

  it('환급과 상관없는 사람은 내보낸다', () => {
    expect(refundViewOf({ ...base, loaded: true, settled: true }).kind).toBe(
      'outsider',
    );
  });

  it('아직 모르면 기다린다', () => {
    expect(refundViewOf(base).kind).toBe('loading');
  });
});
