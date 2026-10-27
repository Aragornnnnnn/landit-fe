// LocaleGate — 저장 언어 조회 계약 검증 (백엔드 응답 언어를 따르고, 웹은 저장하지 않는다)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getUserLocale } from './api/user-locale';
import { LocaleGate } from './LocaleGate';

vi.mock('./api/user-locale', () => ({ getUserLocale: vi.fn() }));
const getMock = vi.mocked(getUserLocale);

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

  it('백엔드가 아직 언어를 확정하지 않았어도(selectionRequired) 응답 언어로 그린다 — 화면과 콘텐츠 언어를 맞춘다', async () => {
    document.documentElement.lang = 'ja';
    getMock.mockResolvedValue({ locale: 'ko', selectionRequired: true });
    renderGate();
    signIn(1);

    await waitFor(() => expect(document.cookie).toContain('landit-locale=ko'));
    expect(refresh).toHaveBeenCalled();
  });

  it('일본어로 저장된 사용자는 기기 언어가 한국어여도 일본어를 유지한다', async () => {
    getMock.mockResolvedValue({ locale: 'ja', selectionRequired: false });
    renderGate();
    signIn(1);

    await waitFor(() => expect(document.cookie).toContain('landit-locale=ja'));
    expect(refresh).toHaveBeenCalled();
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

  it('조회가 실패하면 저장 언어를 쿠키에 담지 않는다', async () => {
    getMock.mockRejectedValue(new Error('404'));
    renderGate();
    signIn(1);

    await waitFor(() => expect(getMock).toHaveBeenCalled());
    expect(document.cookie).not.toContain('landit-locale=');
    expect(refresh).not.toHaveBeenCalled();
  });
});
