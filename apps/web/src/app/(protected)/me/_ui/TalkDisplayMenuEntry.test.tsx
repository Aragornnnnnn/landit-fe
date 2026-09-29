// TalkDisplayMenuEntry — 행을 눌러 연 시트의 두 토글이 저장값을 따르고, 누르면 설정을 바꾸며 계측을 남긴다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getDisplaySetting,
  setDisplaySetting,
} from '@/features/conversation/model/talk-display';

import { TalkDisplayMenuEntry } from './TalkDisplayMenuEntry';

const mocks = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
// motion 애니메이션(BottomSheet)을 순수 DOM으로 치환 — 렌더러 아이덴티티 문제 회피
vi.mock('motion/react', () => import('@/shared/motion/test-double'));

beforeEach(() => {
  localStorage.clear();
  mocks.track.mockClear();
});
afterEach(() => cleanup());

const openSheet = () => {
  render(<TalkDisplayMenuEntry />);
  fireEvent.click(screen.getByRole('button', { name: '대화' }));
};

describe('TalkDisplayMenuEntry', () => {
  it('기본은 상대 말 글자 항상 보기·해석 항상 보기 모두 끔이다', () => {
    openSheet();

    expect(
      screen.getByRole('switch', { name: '상대 말 글자 항상 보기' }),
    ).toHaveAttribute('aria-checked', 'false');
    expect(
      screen.getByRole('switch', { name: '해석 항상 보기' }),
    ).toHaveAttribute('aria-checked', 'false');
  });

  it('상대 말 글자 항상 보기를 켜면 저장값과 계측에 남는다', () => {
    openSheet();

    fireEvent.click(
      screen.getByRole('switch', { name: '상대 말 글자 항상 보기' }),
    );

    expect(getDisplaySetting('alwaysShowText')).toBe(true);
    expect(mocks.track).toHaveBeenCalledWith('Talk Display Changed', {
      setting: 'always_show_text',
      enabled: true,
    });
  });

  it('해석 항상 보기를 켜면 저장값과 계측에 남는다', () => {
    openSheet();

    fireEvent.click(screen.getByRole('switch', { name: '해석 항상 보기' }));

    expect(getDisplaySetting('alwaysShowTranslation')).toBe(true);
    expect(mocks.track).toHaveBeenCalledWith('Talk Display Changed', {
      setting: 'always_show_translation',
      enabled: true,
    });
  });

  it('바꿔 둔 기기에서는 바꾼 값으로 열린다', () => {
    setDisplaySetting('alwaysShowText', true);
    openSheet();

    expect(
      screen.getByRole('switch', { name: '상대 말 글자 항상 보기' }),
    ).toHaveAttribute('aria-checked', 'true');
  });
});
