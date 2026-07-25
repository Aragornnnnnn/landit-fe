// 힌트 버튼 단계 계약 — 힌트→정답 2단계를 다 쓰면 사라진다 (복습 영작 전용)
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HintButton } from './HintButton';

afterEach(cleanup);

describe('HintButton', () => {
  it('처음에는 힌트 보기, 한 번 쓰면 정답 보기를 보여주고, 두 단계를 다 쓰면 사라진다', () => {
    const { rerender } = render(<HintButton step={0} onAdvance={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveTextContent('힌트 보기');

    rerender(<HintButton step={1} onAdvance={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveTextContent('정답 보기');

    rerender(<HintButton step={2} onAdvance={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
