// 표현 리스트 상단 진행바의 색 계약 검증 — 카드 앞면(ExpressionProgress)과 같은 규칙을 따르는지
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Expression } from '../api/list';
import { ExpressionList } from './ExpressionList';

afterEach(() => cleanup());

const expression = (overrides: Partial<Expression>): Expression => ({
  expressionId: 1,
  displayOrder: 1,
  targetExpressionText: 'break a leg',
  baseExpressionMeaningText: '행운을 빌어요',
  completed: false,
  locked: false,
  ...overrides,
});

describe('ExpressionList 진행바', () => {
  it('아직 남은 표현이 있으면 주황 톤이다', () => {
    render(
      <ExpressionList
        expressions={[
          expression({ expressionId: 1, completed: true }),
          expression({ expressionId: 2, completed: false }),
        ]}
        onSelect={vi.fn()}
      />,
    );

    const label = screen.getByText('1/2 완료');
    expect(label.className).toContain('text-primary');
    expect(label.className).not.toContain('text-success');

    const fill = label.closest('.mb-5')?.querySelector('.h-full.rounded-full');
    expect(fill?.className).toContain('bg-primary');
    expect(fill?.className).not.toContain('bg-success');
  });

  it('전부 완료했으면 초록 톤으로 바뀐다', () => {
    render(
      <ExpressionList
        expressions={[
          expression({ expressionId: 1, completed: true }),
          expression({ expressionId: 2, completed: true }),
        ]}
        onSelect={vi.fn()}
      />,
    );

    const label = screen.getByText('2/2 완료');
    expect(label.className).toContain('text-success');
    expect(label.className).not.toContain('text-primary');

    const fill = label.closest('.mb-5')?.querySelector('.h-full.rounded-full');
    expect(fill?.className).toContain('bg-success');
    expect(fill?.className).not.toContain('bg-primary');
  });

  it('배정된 표현이 없으면(0/0) 초록으로 착각하지 않는다', () => {
    render(<ExpressionList expressions={[]} onSelect={vi.fn()} />);

    const label = screen.getByText('0/0 완료');
    expect(label.className).toContain('text-primary');
    expect(label.className).not.toContain('text-success');

    const fill = label.closest('.mb-5')?.querySelector('.h-full.rounded-full');
    expect(fill?.className).toContain('bg-primary');
    expect(fill?.className).not.toContain('bg-success');
  });
});

describe('ExpressionList 무료·PREMIUM 표시', () => {
  it('무료 사용자 목록에도 「무료」·「PREMIUM」 표시를 붙이지 않는다 — 어느 표현이든 눌러 보고 싶게', () => {
    // Given 첫 표현이 무료로 열린 무료 사용자의 목록
    render(
      <ExpressionList
        premiumLocked
        freeTrialExpressionId={1}
        expressions={[
          expression({ expressionId: 1 }),
          expression({ expressionId: 2, locked: true }),
          expression({ expressionId: 3 }),
        ]}
        onSelect={vi.fn()}
      />,
    );

    // Then 표시는 하나도 없다
    expect(screen.queryByText('무료')).not.toBeInTheDocument();
    expect(screen.queryByText('PREMIUM')).not.toBeInTheDocument();
  });

  it('무료로 열린 표현에는 투어 스포트라이트가 찾을 표식만 남긴다', () => {
    const { container } = render(
      <ExpressionList
        premiumLocked
        freeTrialExpressionId={3}
        expressions={[
          expression({ expressionId: 3 }),
          expression({ expressionId: 4 }),
        ]}
        onSelect={vi.fn()}
      />,
    );

    expect(container.querySelectorAll('[data-free-expression]')).toHaveLength(
      1,
    );
  });

  it('유료 사용자 목록에는 스포트라이트 표식도 없다', () => {
    const { container } = render(
      <ExpressionList
        freeTrialExpressionId={1}
        expressions={[expression({ expressionId: 1 })]}
        onSelect={vi.fn()}
      />,
    );

    expect(container.querySelector('[data-free-expression]')).toBeNull();
  });
});
