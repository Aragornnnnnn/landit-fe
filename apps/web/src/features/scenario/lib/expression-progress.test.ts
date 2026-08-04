// 표현 학습 진행 단계 판정 검증 — 남은 개수가 다음 행동(배우기/이어서/복습)을 가른다
import { describe, expect, it } from 'vitest';

import { expressionStageOf } from './expression-progress';

describe('expressionStageOf', () => {
  it('배정된 표현이 없으면 보여줄 진행도가 없다', () => {
    // Given 표현이 하나도 배정되지 않은 시나리오에서
    // When 진행 단계를 물으면
    // Then 게이지도 버튼도 그릴 것이 없다
    expect(expressionStageOf(0, 0)).toBe('unavailable');
  });

  it('하나도 안 배웠으면 아직 시작 전이다', () => {
    expect(expressionStageOf(0, 5)).toBe('none');
  });

  it('일부만 배웠으면 이어서 할 것이 남아 있다', () => {
    expect(expressionStageOf(2, 5)).toBe('partial');
  });

  it('다 배웠으면 복습만 남는다', () => {
    expect(expressionStageOf(5, 5)).toBe('done');
  });

  it('완료 수가 전체를 넘어도 다 한 것으로 본다', () => {
    // Given 표현이 줄어 완료 수가 전체보다 커진 상태에서
    // When 진행 단계를 물으면
    // Then 게이지가 넘치지 않게 완료로 본다
    expect(expressionStageOf(7, 5)).toBe('done');
  });
});
