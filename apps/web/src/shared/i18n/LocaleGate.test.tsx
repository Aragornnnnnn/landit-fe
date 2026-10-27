// LocaleGate — 저장 언어 조회·최초 선택·저장 계약 검증 (자동 저장 금지, 선택 필요할 때만 선택 화면, 고른 값만 저장)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getUserLocale, updateUserLocale } from './api/user-locale';
import { LocaleGate } from './LocaleGate';

vi.mock('./api/user-locale', () => ({
  getUserLocale: vi.fn(),
  updateUserLocale: vi.fn(),
}));
const getMock = vi.mocked(getUserLocale);
const putMock = vi.mocked(updateUserLocale);

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const signIn = (userId: number) =>
  act(() =>
    useAuthStore.getState().setAuth('access', 'refresh', { userId } as never),
  );

const renderGate = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <LocaleGate />
    </QueryClientProvider>,
  );

beforeEach(() => {
  document.documentElement.lang = 'ko';
  document.cookie = 'landit-locale=; max-age=0; path=/';
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  useAuthStore.getState().clearAuth();
});

describe('LocaleGate', () => {
  it('로그인 전에는 조회하지 않는다', () => {
    renderGate();

    expect(getMock).not.toHaveBeenCalled();
  });

  it('영어만 쓰는 신규 사용자처럼 선택이 필요하면 선택 화면을 띄우고, 임시 ko로 저장하지 않는다', async () => {
    getMock.mockResolvedValue({ locale: 'ko', selectionRequired: true });
    renderGate();
    signIn(1);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(putMock).not.toHaveBeenCalled();
    expect(document.cookie).not.toContain('landit-locale=ko');
  });

  it('고른 언어만 저장하고, 성공하면 선택 화면을 닫고 그 언어로 다시 그린다', async () => {
    getMock.mockResolvedValue({ locale: 'ko', selectionRequired: true });
    putMock.mockResolvedValue({ locale: 'ja', selectionRequired: false });
    renderGate();
    signIn(1);

    fireEvent.click(await screen.findByRole('button', { name: '日本語' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(putMock).toHaveBeenCalledWith('ja');
    expect(document.cookie).toContain('landit-locale=ja');
    expect(refresh).toHaveBeenCalled();
  });

  it('저장이 실패하면 선택 완료로 치지 않고 다시 고르게 한다', async () => {
    getMock.mockResolvedValue({ locale: 'ko', selectionRequired: true });
    putMock.mockRejectedValue(new Error('network'));
    renderGate();
    signIn(1);

    fireEvent.click(await screen.findByRole('button', { name: '日本語' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(document.cookie).not.toContain('landit-locale=ja');
  });

  it('일본어를 고른 사용자는 기기 언어가 한국어여도 일본어를 유지하고, 다시 저장하지 않는다', async () => {
    getMock.mockResolvedValue({ locale: 'ja', selectionRequired: false });
    renderGate();
    signIn(1);

    await waitFor(() => expect(document.cookie).toContain('landit-locale=ja'));
    expect(refresh).toHaveBeenCalled();
    expect(putMock).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('저장값이 지금 화면 언어와 같으면 다시 그리지 않는다', async () => {
    getMock.mockResolvedValue({ locale: 'ko', selectionRequired: false });
    renderGate();
    signIn(1);

    await waitFor(() => expect(document.cookie).toContain('landit-locale=ko'));
    expect(refresh).not.toHaveBeenCalled();
  });

  it('계정을 바꾸면 그 계정의 저장 언어를 새로 읽는다', async () => {
    getMock.mockResolvedValueOnce({ locale: 'ko', selectionRequired: false });
    getMock.mockResolvedValueOnce({ locale: 'ja', selectionRequired: false });
    renderGate();
    signIn(1);
    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(1));

    signIn(2);

    await waitFor(() => expect(document.cookie).toContain('landit-locale=ja'));
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  it('조회가 실패하면 아무것도 저장하지 않고 선택 화면도 띄우지 않는다', async () => {
    getMock.mockRejectedValue(new Error('404'));
    renderGate();
    signIn(1);

    await waitFor(() => expect(getMock).toHaveBeenCalled());
    expect(putMock).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.cookie).not.toContain('landit-locale=');
  });
});
