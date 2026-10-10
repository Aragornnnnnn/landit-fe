// NicknameSheet — 지금 이름을 채운 채 열고, 규칙에 맞을 때만 저장해 전역 회원 정보에 반영한다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NicknameSheet } from './NicknameSheet';

const mocks = vi.hoisted(() => ({
  updateNickname: vi.fn(),
  setNickname: vi.fn(),
}));
vi.mock('../_api/nickname', () => ({ updateNickname: mocks.updateNickname }));
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ setNickname: mocks.setNickname }),
}));
vi.mock('@/shared/monitoring/report', () => ({ reportWarning: vi.fn() }));

const onClose = vi.fn();
const renderSheet = (current: string) =>
  render(<NicknameSheet open current={current} onClose={onClose} />);
const input = () => screen.getByRole('textbox');
const saveButton = () => screen.getByRole('button', { name: /할게요/ });

beforeEach(() => {
  mocks.updateNickname.mockReset();
  mocks.setNickname.mockReset();
  onClose.mockReset();
});
afterEach(() => cleanup());

describe('NicknameSheet', () => {
  it('지금 이름을 채운 채 열리고, 바꾸지 않으면 저장할 수 없다', () => {
    renderSheet('준서');

    expect(screen.getByText('뭐라고 불러드릴까요?')).toBeInTheDocument();
    expect(input()).toHaveValue('준서');
    expect(saveButton()).toBeDisabled();
  });

  it('가입 때 받은 이름이 20자를 넘으면 열자마자 줄이라고 알려준다', () => {
    renderSheet('가'.repeat(21));

    expect(screen.getByText('20자까지 쓸 수 있어요')).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it('기호나 이모지를 넣으면 글자·숫자만 된다고 알려준다', () => {
    renderSheet('준서');
    fireEvent.change(input(), { target: { value: '준서😀' } });

    expect(
      screen.getByText('한글·영문·숫자와 띄어쓰기만 쓸 수 있어요'),
    ).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it('앞뒤 공백을 떼고 저장한 뒤 서버가 돌려준 이름으로 회원 정보를 바꾸고 닫는다', async () => {
    mocks.updateNickname.mockResolvedValue({ nickname: '래디 친구' });
    renderSheet('준서');
    fireEvent.change(input(), { target: { value: '  래디 친구 ' } });
    fireEvent.click(saveButton());

    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.updateNickname).toHaveBeenCalledWith('래디 친구');
    expect(mocks.setNickname).toHaveBeenCalledWith('래디 친구');
  });

  it('저장이 실패하면 시트를 연 채 다시 시도하라고 알려준다', async () => {
    mocks.updateNickname.mockRejectedValue(new Error('boom'));
    renderSheet('준서');
    fireEvent.change(input(), { target: { value: '래디' } });
    fireEvent.click(saveButton());

    expect(
      await screen.findByText('저장하지 못했어요. 다시 시도해 주세요'),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(mocks.setNickname).not.toHaveBeenCalled();
  });

  it('저장하는 동안에는 바깥을 눌러도 닫히지 않는다 — 늦게 온 응답이 다시 연 시트를 닫지 않게', async () => {
    let finish: (value: { nickname: string }) => void = () => {};
    mocks.updateNickname.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderSheet('준서');
    fireEvent.change(input(), { target: { value: '래디' } });
    fireEvent.click(saveButton());
    fireEvent.click(screen.getByTestId('bottom-sheet-dim'));

    expect(onClose).not.toHaveBeenCalled();

    finish({ nickname: '래디' });
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});
