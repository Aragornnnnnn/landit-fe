// 초대 코드 칸 동작 테스트 — 직접 입력은 정리해서, 붙여넣기는 코드만 찾아서 넘긴다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ReferralCodeInput } from './ReferralCodeInput';

const renderInput = () => {
  const onType = vi.fn();
  const onPaste = vi.fn();
  render(
    <ReferralCodeInput
      value=""
      tone="idle"
      onType={onType}
      onPaste={onPaste}
    />,
  );
  return { input: screen.getByLabelText('초대 코드'), onType, onPaste };
};

afterEach(() => {
  cleanup();
});

describe('ReferralCodeInput', () => {
  it('소문자로 치면 대문자 코드로 넘긴다', () => {
    const { input, onType } = renderInput();

    fireEvent.change(input, { target: { value: 'k7qm' } });

    expect(onType).toHaveBeenCalledWith('K7QM');
  });

  it('메시지를 통째로 붙여넣으면 그 안의 코드만 넘긴다', () => {
    const { input, onPaste } = renderInput();

    fireEvent.paste(input, {
      clipboardData: { getData: () => '같이 해요 🙌\n초대 코드: K7QM3XPA' },
    });

    expect(onPaste).toHaveBeenCalledWith('K7QM3XPA');
  });

  it('붙여넣은 글에 코드가 없으면 null을 넘긴다', () => {
    const { input, onPaste } = renderInput();

    fireEvent.paste(input, { clipboardData: { getData: () => '안녕하세요' } });

    expect(onPaste).toHaveBeenCalledWith(null);
  });
});
