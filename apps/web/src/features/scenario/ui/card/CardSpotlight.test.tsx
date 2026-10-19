// 카드 스포트라이트의 빠져나갈 길 — 비출 자리가 없으면 알리고, 넘기기 버튼을 누르면 알린다
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
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

  it('넘기기를 주면 「다음에 할게요」로 빠져나갈 수 있다', () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const onSkip = vi.fn();
    render(
      <CardSpotlight
        findTarget={() => target}
        label="첫 표현"
        settleMs={0}
        onTap={vi.fn()}
        onSkip={onSkip}
      >
        안내
      </CardSpotlight>,
    );
    act(() => vi.advanceTimersByTime(0));

    fireEvent.click(screen.getByText('다음에 할게요'));

    expect(onSkip).toHaveBeenCalledTimes(1);
    target.remove();
  });
});
