// 스몰톡 첫 안내 — 끝까지 보지 않아도 언제든 닫고 나갈 수 있어야 한다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { IntroGuide } from './IntroGuide';

afterEach(() => cleanup());

const guide = (spot: number | null, onClose = vi.fn()) => (
  <IntroGuide
    sentences={[{ image: '/randy.webp', parts: [['안녕하세요', false]] }]}
    spotlights={['limit']}
    spot={spot}
    onNext={vi.fn()}
    onClose={onClose}
  />
);

describe('IntroGuide', () => {
  it.each([
    ['래디가 말하는 중', null],
    ['자리를 비추는 중', 0],
  ] as const)('%s에도 닫기를 누르면 안내를 닫는다', (_, spot) => {
    // given
    const onClose = vi.fn();
    render(guide(spot, onClose));

    // when
    fireEvent.click(screen.getByRole('button', { name: '안내 닫기' }));

    // then
    expect(onClose).toHaveBeenCalledOnce();
  });
});
