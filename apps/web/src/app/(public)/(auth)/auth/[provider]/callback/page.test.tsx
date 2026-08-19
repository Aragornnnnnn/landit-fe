// 소셜 로그인 콜백 — 제공자 창에서 돌아오면 떠났던 로그인 화면으로 돌아와, 눌렀던 버튼이 로그인 중으로 이어진다
import { Suspense } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SocialLoginCallbackPage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ setAuth: vi.fn() }),
}));
vi.mock('@/shared/auth/web-social-login', () => ({
  readPendingSocialLogin: () => ({
    provider: 'kakao',
    state: 's1',
    redirectUri: 'https://landit.im/auth/kakao/callback',
    codeVerifier: 'v',
    nonce: 'n',
  }),
  clearPendingSocialLogin: vi.fn(),
  startWebSocialLogin: vi.fn(),
}));
// 셸 밖(일반 브라우저)이다 — 네이티브 브릿지는 없다
vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: () => false,
  subscribeFromNative: () => () => {},
}));

afterEach(cleanup);

const renderCallback = async (fetchImpl: () => Promise<unknown>) => {
  vi.stubGlobal('fetch', vi.fn(fetchImpl));
  const params = Promise.resolve({ provider: 'kakao' });
  const searchParams = Promise.resolve({ code: 'c', state: 's1' });
  await act(async () => {
    render(
      <Suspense>
        <SocialLoginCallbackPage params={params} searchParams={searchParams} />
      </Suspense>,
    );
  });
  await act(async () => {
    await Promise.all([params, searchParams]);
  });
};

describe('SocialLoginCallbackPage', () => {
  it('토큰을 교환하는 동안 로그인 화면에서 눌렀던 버튼이 로그인 중으로 이어진다', async () => {
    // given — 교환 요청이 아직 안 돌아왔다
    await renderCallback(() => new Promise(() => {}));

    // then — 로그인 화면 그대로, 카카오 버튼만 진행 중이고 나머지는 잠긴다
    const kakao = screen.getByRole('button', { name: /카카오로 로그인하기/ });
    expect(kakao).toHaveAttribute('aria-busy', 'true');
    expect(
      screen.getByRole('button', { name: /구글로 로그인하기/ }),
    ).toBeDisabled();
    expect(screen.queryByText('로그인 중이에요…')).toBeNull();
  });

  it('로그인에 실패하면 같은 화면에 이유를 보여주고 다시 누를 수 있게 버튼을 푼다', async () => {
    // given — 토큰 교환이 거절됐다
    await renderCallback(async () => ({
      ok: false,
      json: async () => ({ error: '토큰 교환에 실패했어요.' }),
    }));

    // then — 별도 실패 화면으로 빠지지 않고 로그인 화면 위에서 재시도한다
    expect(
      await screen.findByText('토큰 교환에 실패했어요.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /카카오로 로그인하기/ }),
    ).toBeEnabled();
  });
});
