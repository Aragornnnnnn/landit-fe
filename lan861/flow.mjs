// LAN-861 PR 캡처 — 상대가 말하는 중(타이핑 중) → 키보드로 끊은 직후(문장 전체·입력창)
// 음성(ttsVoice)을 비워 소리 없이 타이핑으로 말하게 한다 — 오디오 없이 "말하는 중"을 재현
const OPENING =
  "Hey, you must be my new roommate! I'm Marco, from Spain. I just finished unpacking — what's your name, and where are you from?";
const TRANSLATION =
  '안녕, 네가 새 룸메이트구나! 난 스페인에서 온 마르코야. 방금 짐 다 풀었어. 이름이 뭐고 어디서 왔어?';
const character = { characterId: 'marco', ttsVoice: null };
const daily = {
  date: '2026-11-09',
  playable: true,
  scenario: {
    scenarioId: 1,
    scenarioTitle: '입주 첫날, 룸메이트 Marco와 첫 만남',
    briefing: '기숙사 입주 첫날, 방문을 열자 룸메이트 Marco가 반갑게 인사를 건넨다.',
    conversationGoal: '자기소개를 하고 취미와 한국 여행지를 소개하기',
    thumbnailUrl: null,
    difficulty: 'EASY',
    firstSpeaker: 'AI',
    dailyScenarioType: 'NEW',
    openingPreview: {
      aiOpeningMessage: OPENING,
      aiOpeningMessageTranslation: TRANSLATION,
      questionAudioUrl: null,
      userOpeningInstruction: null,
      innerThought: null,
      innerThoughtType: null,
      answerGuide: null,
      character,
    },
    completed: false,
    completedAt: null,
    starRating: null,
    expressionCount: 0,
    completedExpressionCount: 0,
  },
};
const session = {
  sessionId: 9001,
  scenarioId: 1,
  character,
  sessionType: 'SCENARIO',
  firstSpeaker: 'AI',
  userOpeningInstruction: null,
  currentMessage: {
    messageId: 1,
    turnNumber: 1,
    messageSequence: 1,
    role: 'AI',
    content: OPENING,
    translatedContent: TRANSLATION,
    innerThought: '',
    innerThoughtType: 'NORMAL',
    questionAudioUrl: null,
    answerGuide: null,
  },
  progress: { currentTurnNumber: 1, totalQuestionCount: 3, completed: false },
};

export const setup = async ({ ctx }) => {
  // 영어 글자를 가리지 않고 보여 준다 — 타이핑이 나오는 모습과 끊은 뒤 전문을 보이게
  await ctx.addInitScript(() => localStorage.setItem('landit-talk-always-show-text', 'true'));
  await ctx.route('**/api/**', (route) => {
    const u = new URL(route.request().url());
    const p = u.pathname;
    const ok = (data, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
    if (p.endsWith('/scenarios/daily')) return ok(daily);
    if (p.endsWith('/scenarios/1/sessions')) return ok(session, 201);
    if (p.endsWith('/me/subscription'))
      return ok({ premium: true, subscriptionStatus: 'ACTIVE', periodType: 'YEARLY', expiresAt: null });
    if (p.endsWith('/me/accent-locale')) return ok({ accentLocale: 'EN_US', name: '미국' });
    if (p.endsWith('/me/learning-level')) return ok({ learningLevel: 2 });
    if (p.endsWith('/me/locale')) return ok({ locale: 'ko', selectionRequired: false });
    console.log('UNMOCKED', route.request().method(), p);
    return ok(null);
  });
};

export default async ({ page, shot }) => {
  const dir = process.env.OUT_DIR;
  await page.waitForSelector('button[aria-label="말하기"]');
  // 타이핑이 문장 절반쯤 왔을 때 — 말하는 중인데 마이크가 열려 있다
  await page.waitForTimeout(Number(process.env.SPEAK_MS ?? 2600));
  await shot(`${dir}/1-speaking.png`);
  // 키보드로 끊는다 — 가짜 마이크는 음성 인식 연결에서 막혀, 같은 끊기 경로를 키보드로 보여 준다
  await page.click('button[aria-label="키보드로 입력"]', { force: true });
  await page.waitForTimeout(1000);
  await shot(`${dir}/2-interrupted.png`);
};
