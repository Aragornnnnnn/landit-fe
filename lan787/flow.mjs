// 총평 빈 카드 문구 캡처용 목 — RETRIED=1이면 재도전 응답
const retried = process.env.RETRIED === '1';
const premium = process.env.PREMIUM === '1';
const locale = process.env.LOCALE ?? 'ko';
const feedback = {
  sessionId: 12,
  nativeScore: 72,
  starRating: 2,
  highlightMessage: '주문은 잘 마쳤어요. 조금만 더 자연스럽게 말해 봐요!',
  summaryMessage:
    '원하는 메뉴와 사이즈를 또렷하게 전했어요. 다음엔 요청을 조금 더 부드럽게 덧붙여 보면 훨씬 자연스러워질 거예요.',
  messageFeedbacks: [
    { messageFeedbackId: 1, messageId: 2, turnNumber: 1, feedbackType: 'GOOD' },
    { messageFeedbackId: 2, messageId: 4, turnNumber: 2, feedbackType: 'GOOD' },
    { messageFeedbackId: 3, messageId: 6, turnNumber: 3, feedbackType: 'NEEDS_IMPROVEMENT' },
  ],
  detailFeedbackLocked: false,
  userLevelAssessment: null,
  growthFeedback: null,
  expressionReuse: { pending: false, items: [] },
  hasPreviousSameScenarioCompletion: retried,
};
const history = {
  scenarioId: 3,
  sessions: [
    { sessionId: 12, startedAt: '2026-10-27T21:03:11', endedAt: '2026-10-27T21:08:40', messages: [], feedback },
  ],
};
export const setup = async ({ ctx }) => {
  await ctx.addCookies([{ name: 'landit-locale', value: locale, url: 'http://localhost:3187' }]);
  await ctx.route('**/api/**', (route) => {
    const u = new URL(route.request().url());
    const ok = (data) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
    if (u.pathname.endsWith('/sessions/12/feedback')) return ok(feedback);
    if (u.pathname.endsWith('/scenarios/3/history')) return ok(history);
    if (u.pathname.endsWith('/me/subscription'))
      return ok({ premium, subscriptionStatus: premium ? 'ACTIVE' : 'NONE', periodType: null, expiresAt: null });
    if (u.pathname.endsWith('/me/locale')) return ok({ locale, selectionRequired: false });
    console.log('UNMOCKED', route.request().method(), u.pathname);
    return ok(null);
  });
};
export default async ({ shot }) => { await shot(); };
