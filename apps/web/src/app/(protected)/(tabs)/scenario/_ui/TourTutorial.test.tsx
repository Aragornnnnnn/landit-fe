// 튜토리얼은 키보드로도 넘긴다 — 「다음 문장」 버튼이 쓰는 중인 문장을 끝까지 보여 주고, 다 쓴 문장만 읽어 준다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TourTutorial } from './TourTutorial';

afterEach(() => cleanup());

describe('TourTutorial', () => {
  it('「다음 문장」을 누르면 쓰는 중인 문장을 끝까지 보여 주고 그 문장을 한 번 읽어 준다', () => {
    // Given 첫 문장을 쓰기 시작한 튜토리얼
    render(<TourTutorial dailyWon={500} onDone={vi.fn()} />);

    // When 다음 문장 버튼을 누르면
    fireEvent.click(screen.getByRole('button', { name: '다음 문장' }));

    // Then 다 쓴 문장이 읽기 칸에 들어간다
    expect(screen.getByText(/500원을 받을 수 있어요/)).toBeInTheDocument();
  });
});
