// MicControl — 남은 시간 링이 완료 버튼 둘레(92px)에 정확히 맞는 크기로 그려지는지 검증한다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MicControl } from './MicControl';

// 연출은 순수 DOM으로 치환한다 — 대역이 하는 일은 shared/motion/test-double 참고
vi.mock('motion/react', () => import('@/shared/motion/test-double'));

afterEach(cleanup);

const renderListening = (remainingRatio?: number) =>
  render(
    <MicControl
      phase="USER_SPEAKING"
      onPress={vi.fn()}
      onCancel={vi.fn()}
      onDone={vi.fn()}
      remainingRatio={remainingRatio}
    />,
  );

describe('MicControl 남은 시간 링', () => {
  it('링 svg에 크기를 명시한다 — inset만 주면 WebKit이 버튼 폭(80px)으로 잡아 링이 어긋난다', () => {
    // Given: 남은 시간이 있는 대화(스몰톡)에서 듣는 중
    renderListening(0.7);

    // When: 완료 버튼 안의 링 svg를 찾으면
    const ring = screen
      .getByRole('button', { name: '답변 완료' })
      .querySelector('svg[viewBox="0 0 92 92"]');

    // Then: viewBox와 같은 92px로 width·height가 박혀 있다
    expect(ring).toHaveAttribute('width', '92');
    expect(ring).toHaveAttribute('height', '92');
  });

  it('남은 시간이 없는 대화(시나리오)에선 링 대신 펄스를 그린다', () => {
    // Given: remainingRatio 없이 듣는 중
    renderListening();

    // Then: 링 svg가 없다
    expect(
      screen
        .getByRole('button', { name: '답변 완료' })
        .querySelector('svg[viewBox="0 0 92 92"]'),
    ).toBeNull();
  });
});
