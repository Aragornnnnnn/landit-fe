// LoginButton — 렌더와 클릭·비활성 동작 검증 (RTL 파이프라인 확인용 예시)
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LoginButton } from './LoginButton';

afterEach(cleanup);

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

  it('recent면 「최근 로그인」이 버튼 설명으로 붙고 버튼 이름은 그대로다', () => {
    // given — 지난번에 이 방법으로 로그인한 기기
    render(<LoginButton label="구글로 로그인하기" icon={<svg />} recent />);

    // then — 보조기기에는 설명으로 읽히고 버튼을 찾는 이름에는 섞이지 않는다
    expect(
      screen.getByRole('button', {
        name: '구글로 로그인하기',
        description: '최근 로그인',
      }),
    ).toBeInTheDocument();
  });

  it('recent가 아니면 표시가 없다', () => {
    render(<LoginButton label="구글로 로그인하기" icon={<svg />} />);

    expect(screen.queryByText('최근 로그인')).toBeNull();
  });
});
