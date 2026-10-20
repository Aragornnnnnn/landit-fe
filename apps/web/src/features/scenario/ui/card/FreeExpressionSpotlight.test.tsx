// 프리미엄 프리뷰 뒷면 안내가 프리뷰를 끝낼 때 왜 끝났는지(비출 자리 없음)를 부르는 쪽에 알린다
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FreeExpressionSpotlight } from './FreeExpressionSpotlight';

beforeEach(() => {
  vi.useFakeTimers();
  // jsdom에는 없는 스크롤 — 자리를 재기 전에 부른다
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// 목록 칸 — 표식을 단 칸만 비출 수 있다
const listWith = (markers: string[]) => {
  const list = document.createElement('div');
  for (const marker of markers) {
    const item = document.createElement('div');
    item.setAttribute(marker, '');
    list.appendChild(item);
  }
  document.body.appendChild(list);
  return { current: list };
};

describe('FreeExpressionSpotlight', () => {
  it('목록 소개에서 비출 자리를 못 찾으면 no_target으로 끝낸다', () => {
    const onEnd = vi.fn();
    render(
      <FreeExpressionSpotlight
        list={listWith([])}
        onOpen={vi.fn()}
        onEnd={onEnd}
      />,
    );

    act(() => vi.advanceTimersByTime(900));

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledWith('no_target');
  });
});
