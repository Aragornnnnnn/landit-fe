// FontScaleMenuEntry — "글자 크기" 행을 눌러 연 시트의 바가 저장된 단계를 따르고, 옮기면 바로 적용하며 계측을 남긴다. 구 셸에서는 숨긴다
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
const slider = () => screen.getByRole('slider', { name: '글자 크기' });
const moveTo = (step: number) =>
  fireEvent.change(slider(), { target: { value: String(step) } });

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
  it('아무것도 고른 적 없으면 바가 보통에 놓인 채로 열린다', () => {
    render(<FontScaleMenuEntry />);

    openSheet();

    expect(slider()).toHaveValue('2');
    expect(slider()).toHaveAttribute('aria-valuetext', '보통');
    expect(screen.getByText('보통')).toBeInTheDocument();
  });

  it('이미 고른 기기에서는 그 단계에 놓인 채로 열린다', () => {
    setFontScale(1.3);
    render(<FontScaleMenuEntry />);

    openSheet();

    expect(slider()).toHaveValue('4');
    expect(screen.getByText('가장 크게')).toBeInTheDocument();
  });

  it('바를 옮기면 바로 적용되고 계측에 남는다', () => {
    render(<FontScaleMenuEntry />);
    openSheet();

    moveTo(1);

    expect(getFontScale()).toBe(0.92);
    expect(
      document.documentElement.style.getPropertyValue('--font-scale'),
    ).toBe('0.92');
    expect(mocks.track).toHaveBeenCalledWith('Font Scale Changed', {
      scale: 0.92,
    });
    expect(screen.getByText('작게')).toBeInTheDocument();
  });

  it('바를 누르면 누른 자리에서 가장 가까운 눈금으로 옮긴다 — iOS는 눌러도 값이 바뀌지 않는다', () => {
    render(<FontScaleMenuEntry />);
    openSheet();
    // 바 폭 222px, 손잡이 22px — 눈금은 11px부터 211px까지 50px 간격이다
    vi.spyOn(slider(), 'getBoundingClientRect').mockReturnValue({
      left: 100,
      width: 222,
    } as DOMRect);

    fireEvent.click(slider(), { clientX: 100 + 11 + 50 * 3 + 10 });

    expect(getFontScale()).toBe(1.15);
  });

  it('바 양끝 바깥을 눌러도 끝 눈금에 멈춘다', () => {
    render(<FontScaleMenuEntry />);
    openSheet();
    vi.spyOn(slider(), 'getBoundingClientRect').mockReturnValue({
      left: 100,
      width: 222,
    } as DOMRect);

    fireEvent.click(slider(), { clientX: 100 });

    expect(getFontScale()).toBe(0.85);
  });

  it('같은 단계에 다시 놓으면 계측하지 않는다', () => {
    setFontScale(1.15);
    render(<FontScaleMenuEntry />);
    openSheet();

    moveTo(3);

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
