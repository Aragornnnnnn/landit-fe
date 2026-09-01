// AccentMenuEntry — 마이페이지에서 배울 영어를 다시 고를 수 있는 진입점 계약 검증
import { EVENTS } from '@landit/analytics';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as accentApi from '@/features/onboarding/api/accent';
import { track } from '@/shared/analytics';

import { AccentMenuEntry } from './AccentMenuEntry';

vi.mock('motion/react', () => import('@/shared/motion/test-double'));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('@/shared/monitoring/report', () => ({ reportWarning: vi.fn() }));
// next/image는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 (HeaderStreak 테스트와 같은 이유)
vi.mock('next/image', () => ({ default: () => <span /> }));
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 42 } }),
}));
vi.mock('@/features/onboarding/api/accent', () => ({
  getMyAccentLocale: vi.fn(),
  updateAccentLocale: vi.fn(() => Promise.resolve(null)),
}));

const trackMock = vi.mocked(track);
const getMyAccentLocale = vi.mocked(accentApi.getMyAccentLocale);

const renderEntry = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AccentMenuEntry />
    </QueryClientProvider>,
  );

const openSheet = async () => {
  await waitFor(() => expect(getMyAccentLocale).toHaveBeenCalled());
  fireEvent.click(screen.getByText('배울 영어 변경하기'));
};

beforeEach(() => {
  getMyAccentLocale.mockResolvedValue({ accentLocale: null, name: null });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AccentMenuEntry', () => {
  it('메뉴 행을 누르면 선택지 시트가 열린다', async () => {
    renderEntry();

    await openSheet();

    expect(screen.getByText('영국 영어')).toBeInTheDocument();
  });

  it('서버가 아직 안 골랐다고 하면 아무것도 안 골라진 채 열린다 — 온보딩과 달리 기본값을 밀지 않는다', async () => {
    renderEntry();

    await openSheet();

    expect(screen.getByText('미국 영어').closest('button')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByText('선택했어요!').closest('button')).toBeDisabled();
  });

  it('서버가 준 지금 값을 강조해서 보여준다', async () => {
    getMyAccentLocale.mockResolvedValue({
      accentLocale: 'EN_AU',
      name: '호주',
    });

    renderEntry();
    await openSheet();

    expect(screen.getByText('호주 영어').closest('button')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('다른 선택지를 고르고 확인을 눌러야 서버에 실리고 시트가 닫힌다', async () => {
    renderEntry();
    await openSheet();
    fireEvent.click(screen.getByText('영국 영어'));
    expect(accentApi.updateAccentLocale).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('선택했어요!'));

    expect(screen.queryByText('영국 영어')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(accentApi.updateAccentLocale).toHaveBeenCalledWith('EN_GB'),
    );
    expect(trackMock).toHaveBeenCalledWith(EVENTS.ACCENT_CHANGED, {
      accent: 'EN_GB',
    });
  });

  it('지금 값을 못 받아도 선택지는 그대로 보여준다 — 목록은 조회와 무관한 프론트 상수다', async () => {
    getMyAccentLocale.mockRejectedValue(new Error('network'));

    renderEntry();
    await waitFor(() => expect(getMyAccentLocale).toHaveBeenCalled());
    fireEvent.click(screen.getByText('배울 영어 변경하기'));

    expect(screen.getByText('미국 영어')).toBeInTheDocument();
    expect(screen.getByText('영국 영어')).toBeInTheDocument();
    expect(screen.getByText('호주 영어')).toBeInTheDocument();
  });

  it('지금 값을 모르면 아무것도 안 골라둔 채 열고 CTA를 잠근다 — 기본값으로 덮어쓰지 않게', async () => {
    getMyAccentLocale.mockRejectedValue(new Error('network'));

    renderEntry();
    await waitFor(() => expect(getMyAccentLocale).toHaveBeenCalled());
    fireEvent.click(screen.getByText('배울 영어 변경하기'));

    expect(screen.getByText('미국 영어').closest('button')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByText('선택했어요!').closest('button')).toBeDisabled();
  });

  it('직접 고르면 잠긴 CTA가 풀린다 — 값을 못 받았어도 스스로 정할 수는 있다', async () => {
    getMyAccentLocale.mockRejectedValue(new Error('network'));

    renderEntry();
    await waitFor(() => expect(getMyAccentLocale).toHaveBeenCalled());
    fireEvent.click(screen.getByText('배울 영어 변경하기'));
    fireEvent.click(screen.getByText('호주 영어'));

    fireEvent.click(screen.getByText('선택했어요!'));

    await waitFor(() =>
      expect(accentApi.updateAccentLocale).toHaveBeenCalledWith('EN_AU'),
    );
  });

  it('온보딩에서만 할 각주는 시트에 뜨지 않는다 — 이미 마이페이지다', async () => {
    renderEntry();

    await openSheet();

    expect(
      screen.queryByText('배울 영어는 마이페이지에서 언제든 변경할 수 있어요'),
    ).not.toBeInTheDocument();
  });
});
