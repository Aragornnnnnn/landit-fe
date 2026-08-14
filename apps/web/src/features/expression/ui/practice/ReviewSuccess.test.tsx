// 복습 성공 콘페티의 계약 검증 — 모션 감소 설정을 존중해야 한다
import { cleanup, render } from '@testing-library/react';
import confetti from 'canvas-confetti';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ReviewSuccess } from './ReviewSuccess';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

afterEach(() => cleanup());

describe('ReviewSuccess', () => {
  it('콘페티는 모션 감소 설정을 존중한다', () => {
    // Given 복습 정답으로 획득 연출이 마운트되면
    render(
      <ReviewSuccess
        expression="Break a leg"
        meaning="행운을 빌어"
        onFinish={vi.fn()}
        finishing={false}
      />,
    );

    // When 콘페티가 발사될 때
    const calls = vi.mocked(confetti).mock.calls;

    // Then 세 발 전부 disableForReducedMotion이 켜져 있어야 한다
    expect(calls).toHaveLength(3);
    for (const [options] of calls) {
      expect(options?.disableForReducedMotion).toBe(true);
    }
  });
});
