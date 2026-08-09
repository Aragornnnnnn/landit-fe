// 표현 진행 게이지의 화면 계약 검증 — 단계별 문구와 그리지 않는 조건
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ExpressionProgress } from './ExpressionProgress';

afterEach(() => cleanup());

describe('ExpressionProgress', () => {
  it('배정된 표현이 없으면 아무것도 그리지 않는다', () => {
    // Given 표현이 하나도 없는 시나리오에서
    const { container } = render(
      <ExpressionProgress completed={0} total={0} onLearn={vi.fn()} />,
    );

    // When 게이지를 그리면
    // Then 남는 것이 없다 — 0/0 완료를 보여줄 이유가 없다
    expect(container).toBeEmptyDOMElement();
  });

  it('하나도 안 배웠으면 시작을 권한다', () => {
    render(<ExpressionProgress completed={0} total={5} onLearn={vi.fn()} />);

    expect(screen.getByText('0/5 완료')).toBeTruthy();
    expect(screen.getByRole('button', { name: '표현 배우기' })).toBeTruthy();
  });

  it('배우다 말았으면 이어서 하자고 한다', () => {
    render(<ExpressionProgress completed={2} total={5} onLearn={vi.fn()} />);

    expect(screen.getByText('2/5 완료')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: '이어서 표현 배우기' }),
    ).toBeTruthy();
  });

  it('다 배웠으면 복습으로 바뀐다', () => {
    render(<ExpressionProgress completed={5} total={5} onLearn={vi.fn()} />);

    expect(screen.getByText('5/5 완료')).toBeTruthy();
    expect(screen.getByRole('button', { name: '표현 복습하기' })).toBeTruthy();
  });

  it('완료 수가 전체를 넘어도 게이지가 넘치지 않는다', () => {
    // Given 서버 값이 어긋나 완료 수가 전체보다 큰 상태에서
    render(<ExpressionProgress completed={7} total={5} onLearn={vi.fn()} />);

    // When 게이지를 그리면
    // Then 전체 수에서 멈춘다
    expect(screen.getByText('5/5 완료')).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe(
      '5',
    );
  });

  it('완료 수가 음수여도 0으로 본다', () => {
    render(<ExpressionProgress completed={-1} total={5} onLearn={vi.fn()} />);

    expect(screen.getByText('0/5 완료')).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe(
      '0',
    );
  });

  it('버튼을 누르면 학습으로 넘긴다', () => {
    const onLearn = vi.fn();
    render(<ExpressionProgress completed={2} total={5} onLearn={onLearn} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onLearn).toHaveBeenCalledTimes(1);
  });
});
