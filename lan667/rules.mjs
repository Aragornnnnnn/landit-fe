// 환급 규칙 시트와 환급 페이월의 규칙 줄 캡처 — ADMIN 가짜 세션 + 셸 컨텍스트(앱 1.4.0)
const ok = (data) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ success: true, data }),
});
export const setup = async ({ ctx }) => {
  await ctx.addInitScript(() => {
    localStorage.setItem(
      'landit-auth',
      JSON.stringify({
        state: {
          refreshToken: 'capture',
          member: { userId: 1, provider: 'KAKAO', email: 'c@landit.im', nickname: '캡처', role: 'ADMIN' },
        },
        version: 0,
      }),
    );
    localStorage.setItem('landit-onboarding-seen', '1');
    window.__LANDIT_NATIVE__ = { platform: 'ios', appVersion: '1.4.0', buildNumber: '18', bridgeVersion: 7 };
  });
  await ctx.route('**/api/**', (route) => {
    const url = route.request().url();
    if (url.includes('/auth/token/refresh'))
      return route.fulfill(ok({ accessToken: 'a', accessTokenExpiresIn: 3600, refreshToken: 'r', refreshTokenExpiresIn: 86400 }));
    if (url.includes('/me/subscription'))
      return route.fulfill(ok({ premium: false, subscriptionStatus: 'NONE', periodType: null, expiresAt: null }));
    return route.fulfill(ok(null));
  });
};
export default async ({ page, shot }) => {
  const mode = process.env.MODE;
  if (mode === 'sheet') {
    await page.click('button[aria-label="환급 규칙"]', { force: true });
    await page.waitForTimeout(1200);
    await shot();
  } else {
    // 페이월 — 규칙 줄이 있는 곳까지 내린다
    const el = page.getByText(/할 때마다/).first();
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await shot();
  }
};
