// 롤플레이 대화 카드 — 말풍선 연출은 카드가 실제로 보일 때 시작한다
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RoleplayTalkDemo } from './RoleplayDemo';

type Callback = (entries: { isIntersecting: boolean }[]) => void;

describe('RoleplayTalkDemo', () => {
  let notify: Callback;

  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: Callback) {
          notify = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('카드가 보이기 전에는 말풍선 연출이 없고, 보이면 시작한다', () => {
    render(<RoleplayTalkDemo talk="zombie" width={236} />);
    const bubble = screen.getByText('How about broccoli instead?');

    expect(bubble).not.toHaveClass('animate-reveal-up');
    // 연출의 시작 모습으로 기다린다 — 다 보였다가 흐려지면 깜빡임으로 보인다
    expect(bubble).toHaveClass('opacity-20');

    act(() => notify([{ isIntersecting: true }]));

    expect(bubble).toHaveClass('animate-reveal-up');
    expect(bubble).not.toHaveClass('opacity-20');
  });
});
