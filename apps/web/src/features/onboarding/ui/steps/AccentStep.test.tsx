// AccentStep — 온보딩 배울 영어 스텝. 고르기 전엔 넘어갈 수 없다는 계약 검증
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AccentStep } from './AccentStep';

vi.mock('motion/react', () => import('@/shared/motion/test-double'));
// next/image는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 (HeaderStreak 테스트와 같은 이유)
vi.mock('next/image', () => ({ default: () => <span /> }));

afterEach(cleanup);

describe('AccentStep', () => {
  it('아무것도 안 골라진 채로 열리고 확인 버튼이 잠겨 있다 — 안 고른 사람이 기본값으로 저장되지 않게', () => {
    render(<AccentStep onNext={vi.fn()} />);

    for (const label of ['미국 영어', '영국 영어', '호주 영어']) {
      expect(screen.getByText(label).closest('button')).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    }
    expect(screen.getByText('선택했어요!').closest('button')).toBeDisabled();
  });

  it('고른 값을 그대로 넘긴다', () => {
    const onNext = vi.fn();

    render(<AccentStep onNext={onNext} />);
    fireEvent.click(screen.getByText('영국 영어'));
    fireEvent.click(screen.getByText('선택했어요!'));

    expect(onNext).toHaveBeenCalledWith('EN_GB');
  });
});
