// 카드 스포트라이트의 빠져나갈 길 — 비출 자리가 없으면 알린다
import { act, cleanup, render } from '@testing-library/react';
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
});
