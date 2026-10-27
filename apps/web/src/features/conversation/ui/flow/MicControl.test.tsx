// MicControl — 남은 시간 링이 완료 버튼 둘레(92px)에 정확히 맞는 크기로 그려지는지 검증한다
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('MicControl 다시 보내기', () => {
  it('전달되지 못한 답변이 있으면 마이크 대신 다시 보내기를 두고, 누르면 다시 보낸다', async () => {
    // Given: 답변이 전달되지 못해 마이크 대기로 돌아온 상태
    const onResend = vi.fn();
    const onPress = vi.fn();
    render(
      <MicControl
        phase="USER_READY"
        onPress={onPress}
        onKeyboard={vi.fn()}
        onCancel={vi.fn()}
        onDone={vi.fn()}
        onResend={onResend}
      />,
    );

    // When: 다시 보내기를 누르면
    await userEvent.click(screen.getByRole('button', { name: '다시 보내기' }));

    // Then: 다시 보내고, 새로 말하거나 타이핑할 길은 없다
    expect(onResend).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: '말하기' })).toBeNull();
    expect(screen.queryByRole('button', { name: '키보드로 입력' })).toBeNull();
  });
});

describe('MicControl 말한 뒤 확인', () => {
  const renderReview = () => {
    const onRetry = vi.fn();
    const onSend = vi.fn();
    render(
      <MicControl
        phase="USER_SPEAKING"
        onPress={vi.fn()}
        onCancel={vi.fn()}
        onDone={vi.fn()}
        review={{ onRetry, onSend }}
      />,
    );
    return { onRetry, onSend };
  };

  it('확인 중이면 완료(■) 대신 다시 말하기와 보내기를 둔다', () => {
    renderReview();

    expect(
      screen.queryByRole('button', { name: '답변 완료' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '다시 말하기' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '보내기' })).toBeInTheDocument();
  });

  it('보내기를 누르면 보낸다', async () => {
    const { onSend, onRetry } = renderReview();

    await userEvent.click(screen.getByRole('button', { name: '보내기' }));

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('다시 말하기를 누르면 다시 말한다', async () => {
    const { onRetry } = renderReview();

    await userEvent.click(screen.getByRole('button', { name: '다시 말하기' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
