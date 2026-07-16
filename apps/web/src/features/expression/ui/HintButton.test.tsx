// 힌트 버튼 단계 계약 — 기본 2단계(힌트→정답), maxStep=1이면 정답 공개 없이 힌트 한 번만
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HintButton } from './HintButton';

afterEach(cleanup);

describe('HintButton', () => {
  it('처음에는 힌트 보기, 한 번 쓰면 정답 보기를 보여준다 (기본 2단계)', () => {
    const { rerender } = render(<HintButton step={0} onAdvance={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveTextContent('힌트 보기');

    rerender(<HintButton step={1} onAdvance={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveTextContent('정답 보기');

    rerender(<HintButton step={2} onAdvance={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('maxStep=1이면 힌트를 한 번 쓴 뒤 사라진다 — 정답 보기 단계가 없다', () => {
    const { rerender } = render(
      <HintButton step={0} maxStep={1} onAdvance={vi.fn()} />,
    );
    expect(screen.getByRole('button')).toHaveTextContent('힌트 보기');

    rerender(<HintButton step={1} maxStep={1} onAdvance={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
