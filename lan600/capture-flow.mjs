import { readFileSync } from 'node:fs';
const MODE = process.env.MODE; // exit-none | complete | complete-fail
const SILENCE = readFileSync(new URL('./silence.wav', import.meta.url));
const ok = (data) => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });

const progress = { sessionStatus: 'IN_PROGRESS', accumulatedSpeakingDurationMs: 4200, speakingTimeLimitMs: 600000, usedSpeakingTimeMs: 124200, remainingSpeakingTimeMs: 475800, expressionGenerationStatus: 'PREPARING' };
const SUMMARY = {
  sessionId: 7, title: '운동 얘기', pending: false, firstSession: false,
  headline: { text: '지난번보다 한 문장을 더 길게 말했어요!', subline: '짧게 나눠도 할 말은 다 했어요.', pose: 'POINT' },
  comparison: { previousSessionId: 6, previousDate: '2026-09-27', current: { speakingMs: 4200, turnCount: 1, maxWordsInTurn: 9 }, previous: { speakingMs: 3100, turnCount: 1, maxWordsInTurn: 6 } },
  growth: null,
  reusedExpressions: { pending: false, items: [] },
  followUp: { pending: false, triggerType: null, question: null, invite: null },
  correctionCount: 1,
};

export const setup = async ({ ctx }) => {
  await ctx.addInitScript(() => {
    localStorage.setItem('landit-smalltalk-intro-guide-seen-v2', 'true');
    localStorage.setItem('landit-smalltalk-tap-greeting-seen', 'true');
  });
  await ctx.route('**/api/**', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    const p = u.pathname; const m = req.method();
    if (p === '/api/tts') return route.fulfill({ status: 200, contentType: 'audio/wav', body: SILENCE });
    if (p === '/api/stt/token') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'fake' }) });
    if (p === '/api/v1/free-talk/topics') return route.fulfill(ok({ topics: [{ topicId: 1, displayName: '주말 계획', displayOrder: 1 }, { topicId: 2, displayName: '요즘 빠진 것', displayOrder: 2 }, { topicId: 3, displayName: '오늘 먹은 것', displayOrder: 3 }], dailySpeakingTimeLimitMs: 600000, usedSpeakingTimeMs: 120000, remainingSpeakingTimeMs: 480000, canStart: true }));
    if (p === '/api/v1/free-talk/sessions' && m === 'POST') return route.fulfill(ok({ sessionId: 7, sessionType: 'FREE_TALK', startMode: 'USER_FIRST', character: { characterId: 'chloe', ttsVoice: null }, title: null, speakingTimeLimitMs: 600000, currentMessage: null }));
    if (p === '/api/v1/free-talk/sessions/7/messages') return route.fulfill(ok({
      sessionId: 7, title: '운동 얘기', turnStatus: 'CONTINUE',
      submittedMessage: { messageId: 100, turnNumber: 1, messageSequence: 1, role: 'USER', innerThoughtProcessingStatus: 'COMPLETED', innerThought: '운동 좋아하나 보네', innerThoughtType: 'NORMAL' },
      nextMessage: { messageId: 101, turnNumber: 2, messageSequence: 2, role: 'AI', content: 'Oh nice! What did you work on today?', translatedContent: '오 좋다! 오늘은 어디 운동했어?', emotion: null },
      progress,
    }));
    if (p.endsWith('/inner-thought')) return route.fulfill(ok({ processingStatus: 'COMPLETED', innerThought: '운동 좋아하나 보네', innerThoughtType: 'NORMAL' }));
    if (p === '/api/v1/free-talk/sessions/7/complete') {
      if (MODE === 'complete-fail') return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, error: { code: 'INTERNAL', message: 'x' } }) });
      return route.fulfill(ok(null));
    }
    if (p === '/api/v1/sessions/7/end') return route.fulfill(ok(null));
    if (p === '/api/v1/free-talk/sessions/7/summary') return route.fulfill(ok(SUMMARY));
    if (p === '/api/v1/auth/token/refresh') return route.fulfill(ok({ accessToken: 'fake-access', refreshToken: 'fake-refresh', accessTokenExpiresIn: 3600 }));
    if (p === '/api/v1/me/accent-locale') return route.fulfill(ok({ accentLocale: 'EN_US', name: '미국' }));
    if (p === '/api/v1/me/learning-level') return route.fulfill(ok({ learningLevel: 3 }));
    if (p === '/api/v1/me/streak') return route.fulfill(ok({ currentStreakDays: 4, activeToday: false, today: '2026-09-29' }));
    if (p === '/api/v1/me/streak/calendar') return route.fulfill(ok({ year: 2026, month: 9, currentStreakDays: 4, activeToday: false, today: '2026-09-29', firstActiveDate: '2026-09-01', longestStreakDays: 6, totalActiveDays: 12, activeDates: ['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28'] }));
    if (p === '/api/v1/me/subscription') return route.fulfill(ok({ premium: true, subscriptionStatus: 'ACTIVE', periodType: 'NORMAL', expiresAt: '2026-10-29T00:00:00', productId: null, store: null, price: null, currency: null, promotion: null }));
    console.log('UNMOCKED', m, p);
    return route.fulfill(ok(null));
  });
  await ctx.routeWebSocket(/api\.deepgram\.com/, (ws) => {
    ws.onMessage((msg) => {
      if (typeof msg === 'string' && msg.includes('Finalize')) {
        ws.send(JSON.stringify({ type: 'Results', is_final: true, from_finalize: true, channel: { alternatives: [{ transcript: 'Hi Chloe! I just got back from the gym.' }] } }));
      }
    });
  });
};

const clickMic = async (page, label) => page.click(`[aria-label="${label}"]`, { force: true });

export default async ({ page, shot }) => {
  await page.waitForSelector('[aria-label="말하기"]');
  await page.waitForTimeout(3800);
  if (MODE === 'exit-none') {
    await shot('01-before-talk.png');
    await page.click('[aria-label="대화 나가기"]');
    await page.waitForURL('**/smalltalk');
    await page.waitForTimeout(2500);
    await shot('02-exit-without-talk.png');
    return;
  }
  await clickMic(page, '말하기');
  await page.waitForTimeout(1500);
  await clickMic(page, '답변 완료');
  await page.waitForSelector('text=What did you work on today?', { timeout: 15000 });
  await page.waitForTimeout(6000);
  if (MODE === 'complete') await shot('03-after-exchange.png');
  await page.click('[aria-label="대화 나가기"]');
  await page.waitForTimeout(1200);
  if (MODE === 'complete') await shot('04-exit-sheet.png');
  await page.click('text=대화 종료하기');
  if (MODE === 'complete') {
    await page.waitForURL('**/summary');
    await page.waitForTimeout(3500);
    await shot('05-summary.png');
  } else {
    await page.waitForURL('**/smalltalk');
    await page.waitForTimeout(600);
    await shot('06-complete-failed.png');
  }
};
