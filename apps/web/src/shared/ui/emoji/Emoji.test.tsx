import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Emoji } from './Emoji';

afterEach(cleanup);

describe('Emoji', () => {
  it('토스페이스에 있는 이모지는 그림으로 그린다', () => {
    const { container } = render(<Emoji>💬</Emoji>);

    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.textContent).toBe('');
  });

  it('토스페이스에 없는 이모지는 문자 그대로 둔다', () => {
    const { container } = render(<Emoji>🫠</Emoji>);

    expect(container.querySelector('svg')).not.toBeInTheDocument();
    expect(container.textContent).toBe('🫠');
  });

  it('설명을 주면 화면 낭독기가 읽을 수 있게 이름을 붙인다', () => {
    render(<Emoji label="말풍선">💬</Emoji>);

    expect(screen.getByRole('img', { name: '말풍선' })).toBeInTheDocument();
  });

  it('설명이 없으면 화면 낭독기에서 감춘다', () => {
    render(<Emoji>💬</Emoji>);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
  it('글자 사이에 놓이도록 인라인으로 그린다', () => {
    // Tailwind preflight가 svg를 block으로 만들어서, 그냥 두면 이모지가 글줄에서 떨어져 나간다
    const { container } = render(<Emoji>💬</Emoji>);

    expect(container.querySelector('svg')).toHaveClass('inline-block');
  });
  it('토스페이스에 없는 이모지도 자리와 이름을 그대로 지킨다', () => {
    // 폴백은 안 걸리는 게 정상이지만, 걸렸을 때 위치 클래스와 접근성 이름까지 잃으면 화면이 무너진다
    render(
      <Emoji label="녹는 얼굴" className="absolute right-0">
        🫠
      </Emoji>,
    );

    expect(screen.getByRole('img', { name: '녹는 얼굴' })).toHaveClass(
      'absolute',
    );
  });
});
