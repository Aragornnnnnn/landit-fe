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

  it('loading이면 비활성이 되고 진행 중임을 알린다', () => {
    // given — 제공자 창으로 갔다 돌아온 뒤 로그인이 마무리되는 중
    const onClick = vi.fn();
    render(
      <LoginButton
        label="카카오로 로그인하기"
        icon={<svg />}
        onClick={onClick}
        loading
      />,
    );

    // when
    const button = screen.getByRole('button', { name: /카카오로 로그인하기/ });
    fireEvent.click(button);

    // then — 눌러도 반응하지 않고, 보조기기엔 진행 중으로 읽힌다
    expect(onClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
