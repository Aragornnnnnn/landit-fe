// LoginButton — 렌더와 클릭·비활성 동작 검증 (RTL 파이프라인 확인용 예시)
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LoginButton } from './LoginButton';

describe('LoginButton', () => {
  it('라벨을 렌더하고 클릭하면 onClick이 호출된다', () => {
    const onClick = vi.fn();
    render(
      <LoginButton
        label="카카오로 계속하기"
        icon={<svg />}
        onClick={onClick}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /카카오로 계속하기/ }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disabled면 클릭해도 onClick이 호출되지 않는다', () => {
    const onClick = vi.fn();
    render(
      <LoginButton
        label="애플로 계속하기"
        icon={<svg />}
        onClick={onClick}
        disabled
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /애플로 계속하기/ }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
