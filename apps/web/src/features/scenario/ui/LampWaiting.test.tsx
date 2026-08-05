// 대기면의 화면 계약 검증 — 문구 분기와 눌리지 않는 조건
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LampWaiting } from './LampWaiting';

vi.mock('motion/react', () => import('@/shared/motion/test-double'));

// next/image도 자기 밑 react 복사본을 잡아 렌더러 아이덴티티가 갈라진다 — 순수 img로 치환한다
vi.mock('next/image', async () => {
  const { createElement } = await import('react');
  return {
    default: ({ src, alt }: { src: string; alt: string }) =>
      createElement('img', { src, alt }),
  };
});

afterEach(() => cleanup());

describe('LampWaiting', () => {
  it('오늘 처음 받는 카드면 래디가 기다린다고 알린다', () => {
    render(<LampWaiting onRub={vi.fn()} />);

    expect(screen.getByText('래디가 램프에서 기다리고 있어요')).toBeTruthy();
    expect(
      screen.getByText('밤 12시가 지나면 오늘의 대화가 사라져요'),
    ).toBeTruthy();
  });

  it('전날 못 끝내 다시 받은 카드면 이어서 하는 것이라고 말한다', () => {
    // Given 어제 시작했다 못 끝낸 대화를 다시 받은 상태에서
    render(<LampWaiting onRub={vi.fn()} retry />);

    // When 대기면을 그리면
    // Then 도착이 아니라 남아 있다고 말한다
    expect(
      screen.getByText('어제 마치지 못한 대화가 남아 있어요'),
    ).toBeTruthy();
  });

  it('램프를 누르면 래디를 부른다', () => {
    const onRub = vi.fn();
    render(<LampWaiting onRub={onRub} />);

    fireEvent.click(
      screen.getByRole('button', { name: '램프 문질러 대화 시작하기' }),
    );

    expect(onRub).toHaveBeenCalledTimes(1);
  });

  it('서버가 시작 불가로 판정하면 램프가 눌리지 않는다', () => {
    // Given 시작할 수 없어 부를 대상이 없는 상태에서
    render(<LampWaiting />);

    // When 대기면을 그리면
    // Then 버튼이 비활성이다
    expect(
      screen.getByRole('button', { name: '램프 문질러 대화 시작하기' }),
    ).toHaveProperty('disabled', true);
  });
});
