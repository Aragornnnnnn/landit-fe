// 해지 사유 플로우 스텝 규칙 — 기타 입력 필수, 다른 방법만 ③, 뒤로가기는 한 칸씩
import { describe, expect, it } from 'vitest';

import {
  canProceedFromReason,
  EMPTY_DRAFT,
  stepAfterMethod,
  stepAfterReason,
  stepBefore,
} from './cancel-flow';

describe('canProceedFromReason', () => {
  it('사유를 안 골랐으면 넘어갈 수 없다', () => {
    expect(canProceedFromReason(EMPTY_DRAFT)).toBe(false);
  });

  it('기타가 아닌 사유는 고르기만 하면 넘어간다', () => {
    expect(canProceedFromReason({ ...EMPTY_DRAFT, reason: 'time' })).toBe(true);
  });

  it('기타는 적은 글이 공백뿐이면 넘어갈 수 없다', () => {
    expect(
      canProceedFromReason({
        ...EMPTY_DRAFT,
        reason: 'other',
        otherText: '  ',
      }),
    ).toBe(false);
  });

  it('기타는 글을 적으면 넘어간다', () => {
    expect(
      canProceedFromReason({
        ...EMPTY_DRAFT,
        reason: 'other',
        otherText: '발음 평가가 엄격해요',
      }),
    ).toBe(true);
  });
});

describe('stepAfterReason', () => {
  it('다른 방법이면 방법 라디오로 간다', () => {
    expect(stepAfterReason('other_method')).toEqual({ kind: 'method' });
  });

  it('나머지 사유는 바로 사유별 화면으로 간다', () => {
    expect(stepAfterReason('price')).toEqual({
      kind: 'retention',
      reason: 'price',
    });
  });
});

describe('stepBefore', () => {
  it('①에서는 돌아갈 스텝이 없다', () => {
    expect(stepBefore({ kind: 'reason' })).toBeNull();
  });

  it('사유별 화면과 방법 라디오에서는 ①로 돌아간다', () => {
    expect(stepBefore({ kind: 'retention', reason: 'bug' })).toEqual({
      kind: 'reason',
    });
    expect(stepBefore({ kind: 'method' })).toEqual({ kind: 'reason' });
  });

  it('③에서는 방법 라디오로 돌아간다', () => {
    expect(stepBefore(stepAfterMethod('youtube'))).toEqual({ kind: 'method' });
  });
});
