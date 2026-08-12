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

    const fill = label.parentElement?.querySelector('.h-full.rounded-full');
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

    const fill = label.parentElement?.querySelector('.h-full.rounded-full');
    expect(fill?.className).toContain('bg-success');
    expect(fill?.className).not.toContain('bg-primary');
  });

  it('배정된 표현이 없으면(0/0) 초록으로 착각하지 않는다', () => {
    render(<ExpressionList expressions={[]} onSelect={vi.fn()} />);

    const label = screen.getByText('0/0 완료');
    expect(label.className).toContain('text-primary');
    expect(label.className).not.toContain('text-success');

    const fill = label.parentElement?.querySelector('.h-full.rounded-full');
    expect(fill?.className).toContain('bg-primary');
    expect(fill?.className).not.toContain('bg-success');
  });
});
