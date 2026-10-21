// FontScaleMenuEntry — "글자 크기" 행을 눌러 연 시트가 저장된 단계를 따르고, 고르면 바로 적용하며 계측을 남긴다. 구 셸에서는 숨긴다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getFontScale, setFontScale } from '@/shared/font-scale/font-scale';

import { FontScaleMenuEntry } from './FontScaleMenuEntry';

const mocks = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
// motion 애니메이션(BottomSheet)을 순수 DOM으로 치환 — 렌더러 아이덴티티 문제 회피
vi.mock('motion/react', () => import('@/shared/motion/test-double'));

const openSheet = () =>
  fireEvent.click(screen.getByRole('button', { name: '글자 크기' }));

beforeEach(() => {
  localStorage.clear();
  mocks.track.mockClear();
});
afterEach(() => {
  cleanup();
  delete window.__LANDIT_NATIVE__;
  document.documentElement.style.removeProperty('--font-scale');
});

describe('FontScaleMenuEntry', () => {
  it('아무것도 고른 적 없으면 보통이 골라진 채로 열린다', () => {
    render(<FontScaleMenuEntry />);

    openSheet();

    expect(screen.getByRole('radio', { name: '보통' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('칸마다 단계 이름이 붙어 있다', () => {
    render(<FontScaleMenuEntry />);

    openSheet();

    expect(
      screen
        .getAllByRole('radio')
        .map((radio) => radio.getAttribute('aria-label')),
    ).toEqual(['가장 작게', '작게', '보통', '크게', '가장 크게']);
  });

  it('이미 고른 기기에서는 그 단계가 골라진 채로 열린다', () => {
    setFontScale(1.3);
    render(<FontScaleMenuEntry />);

    openSheet();

    expect(screen.getByRole('radio', { name: '가장 크게' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('단계를 고르면 바로 적용되고 계측에 남는다', () => {
    render(<FontScaleMenuEntry />);
    openSheet();

    fireEvent.click(screen.getByRole('radio', { name: '작게' }));

    expect(getFontScale()).toBe(0.92);
    expect(
      document.documentElement.style.getPropertyValue('--font-scale'),
    ).toBe('0.92');
    expect(mocks.track).toHaveBeenCalledWith('Font Scale Changed', {
      scale: 0.92,
    });
  });

  it('이미 고른 단계를 다시 누르면 계측하지 않는다', () => {
    setFontScale(1.15);
    render(<FontScaleMenuEntry />);
    openSheet();

    fireEvent.click(screen.getByRole('radio', { name: '크게' }));

    expect(mocks.track).not.toHaveBeenCalled();
  });

  it('브릿지 9 이하 셸에서는 행을 보여주지 않는다', () => {
    window.__LANDIT_NATIVE__ = {
      platform: 'android',
      appVersion: '1.5.0',
      buildNumber: '1',
      bridgeVersion: 9,
    };

    render(<FontScaleMenuEntry />);

    expect(
      screen.queryByRole('button', { name: '글자 크기' }),
    ).not.toBeInTheDocument();
  });
});
