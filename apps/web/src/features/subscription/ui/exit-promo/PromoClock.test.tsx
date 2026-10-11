// 남은 시간 표시 — 자리마다 따로 그려도 읽히는 값은 그대로여야 한다
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PromoClock } from './PromoClock';

afterEach(() => cleanup());

describe('PromoClock', () => {
  it('분:초를 한 자리씩 나눠 그려도 읽히는 값은 같다', () => {
    const { container } = render(<PromoClock seconds={165} />);

    expect(container.textContent).toBe('02:45');
  });

  it('끝나면 00:00이다', () => {
    const { container } = render(<PromoClock seconds={0} />);

    expect(container.textContent).toBe('00:00');
  });
});
