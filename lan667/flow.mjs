// 구독 관리 화면 캡처 — SUB=yearly|pass 로 구독 응답을 바꿔 찍는다
const base = {
  premium: true,
  subscriptionStatus: 'ACTIVE',
  periodType: 'NORMAL',
  currency: 'KRW',
  store: 'APP_STORE',
};
const SUBS = {
  yearly: {
    ...base,
    expiresAt: '2027-10-13T12:00:00',
    productId: 'com.saynow.app.premium.yearly',
    price: 94500,
  },
  pass: {
    ...base,
    expiresAt: '2027-01-21T12:00:00',
    productId: 'com.saynow.app.pass.50000',
    price: 50000,
  },
};
const ok = (data) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ success: true, data }),
});
export const setup = async ({ ctx }) => {
  await ctx.route('**/api/**', (route) => {
    const url = route.request().url();
    if (url.includes('/auth/token/refresh'))
      return route.fulfill(
        ok({
          accessToken: 'a',
          accessTokenExpiresIn: 3600,
          refreshToken: 'r',
          refreshTokenExpiresIn: 86400,
        }),
      );
    if (url.includes('/me/subscription'))
      return route.fulfill(ok(SUBS[process.env.SUB]));
    return route.fulfill(ok(null));
  });
};
