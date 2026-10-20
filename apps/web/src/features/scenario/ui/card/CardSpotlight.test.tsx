// 카드 스포트라이트 — 비출 자리가 없으면 알리고, 말풍선을 자리 위·아래 중 정한 쪽에 붙인다
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CardSpotlight } from './CardSpotlight';

beforeEach(() => {
  vi.useFakeTimers();
  // jsdom에는 없는 스크롤 — 자리를 재기 전에 부른다
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('CardSpotlight', () => {
  it('기다린 뒤에도 비출 자리를 못 찾으면 onMissing을 부른다', () => {
    const onMissing = vi.fn();
    render(
      <CardSpotlight
        findTarget={() => null}
        label="첫 표현"
        settleMs={100}
        onTap={vi.fn()}
        onMissing={onMissing}
      >
        안내
      </CardSpotlight>,
    );

    act(() => vi.advanceTimersByTime(100));

    expect(onMissing).toHaveBeenCalledTimes(1);
  });

  it('말풍선은 기본으로 뚫린 자리 아래에 붙는다', () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    render(
      <CardSpotlight
        findTarget={() => target}
        label="첫 표현"
        settleMs={0}
        onTap={vi.fn()}
        onMissing={vi.fn()}
      >
        안내
      </CardSpotlight>,
    );
    act(() => vi.advanceTimersByTime(0));

    expect(
      screen.getByText('안내').closest('[data-placement]'),
    ).toHaveAttribute('data-placement', 'below');
    target.remove();
  });

  it('위에 두라면 말풍선이 뚫린 자리 위에 붙고, 위쪽 자리를 넓히려 대상을 화면 아래쪽으로 데려온다 — 긴 목록 아래로는 말풍선이 잘린다', () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    render(
      <CardSpotlight
        findTarget={() => target}
        label="표현 목록"
        settleMs={0}
        placement="above"
        onTap={vi.fn()}
        onMissing={vi.fn()}
      >
        안내
      </CardSpotlight>,
    );
    act(() => vi.advanceTimersByTime(0));

    expect(
      screen.getByText('안내').closest('[data-placement]'),
    ).toHaveAttribute('data-placement', 'above');
    expect(target.scrollIntoView).toHaveBeenCalledWith({ block: 'end' });
    target.remove();
  });
});
