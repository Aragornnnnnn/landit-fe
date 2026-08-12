// 화면 주소 상수 — 여러 곳에서 같은 경로를 문자열로 반복하지 않도록 한 곳에 모은다
// 스몰톡 탭이 생기면 복귀 목적지가 둘로 갈리는데, 그 분기도 여기서 시작한다
export const SCENARIO_PATH = '/scenario';
export const SMALLTALK_PATH = '/smalltalk';
export const STREAK_PATH = '/streak';
// 편지함 진입점. 그 아래 주소들은 편지 종류·피드백 유형을 알아야 해서 features/mailbox가 만든다
export const MAILBOX_PATH = '/mailbox';

// 온보딩을 막 끝내고 넘어왔다는 표식 — 홈이 램프를 열되 다시 묻지 않는다.
// flip처럼 주소에 남겨 둔다. 그날 한 번 보면 등장 판정에서 걸러지므로 지울 필요가 없다
export const ONBOARDED_PARAM = 'onboarded';

interface ScenarioReturn {
  // 어느 날 카드로 돌아갈지. 오늘이면 붙이지 않는다 — 날짜 없는 주소가 오늘의 정본이다
  date?: string | null;
  // 표현 마무리 후 복귀 — 그 카드를 뒷면(표현 리스트)으로 펴 둔다.
  // 값은 시나리오 id다. 화면은 있는지만 보지만 계측이 이 id를 읽는다
  flip?: number;
}

// 대화·표현 화면에서 시나리오 탭으로 돌아가는 주소.
// 하루 한 장이 된 뒤로 "어느 날"과 "뒷면을 펼지"가 복귀에 필요한 전부다
export const scenarioReturnPath = ({ date, flip }: ScenarioReturn = {}) => {
  const query = new URLSearchParams();
  if (flip !== undefined) query.set('flip', String(flip));
  if (date) query.set('date', date);

  const search = query.toString();
  return search ? `${SCENARIO_PATH}?${search}` : SCENARIO_PATH;
};

// 보고 있는 날을 달고 간다. 오늘이면 붙이지 않는다 — 날짜 없는 주소가 오늘의 정본이다
const withDate = (path: string, date?: string | null) =>
  date ? `${path}?date=${encodeURIComponent(date)}` : path;

// 대화 화면은 종류별로 /conversation 아래에 모은다 — 탭바 없는 전체화면이라 탭 라우트와 갈라 둔다
// 시나리오 대화. 어느 날 카드인지 알아야 그 날 배정을 받아 오고, 나올 때도 그 날로 돌아간다
export const scenarioTalkPath = (scenarioId: number, date?: string | null) =>
  withDate(`/conversation/scenario/${scenarioId}`, date);

// 스몰톡 대화. 시나리오와 달리 가리킬 콘텐츠가 없어 "누구와 어떻게 시작할지"를 싣는다 —
// 주제를 고르면 상대가 먼저, 직접 걸면 내가 먼저다. 주제는 상대가 먼저일 때만 있다.
// 상대는 홈에서 고른 값이다 — 새로고침해도 고른 상대가 유지되려면 주소에 있어야 한다
export type SmallTalkStart = { partner: string } & (
  { mode: 'ai_first'; topicId: number } | { mode: 'user_first' }
);

export const smallTalkPath = (start: SmallTalkStart) => {
  const query = new URLSearchParams({
    mode: start.mode,
    partner: start.partner,
  });
  if (start.mode === 'ai_first') query.set('topicId', String(start.topicId));

  return `/conversation/smalltalk?${query.toString()}`;
};

// 표현 학습은 /expressions 아래 한자리에 모으고, 둘째 칸에 출처를 세운다.
// 표현의 주인이 대화 종류마다 다르기 때문이다 — 시나리오 표현은 콘텐츠에 붙어 있어 몇 번을 대화해도 같고,
// 스몰톡 표현은 그 대화에서 그때 만들어져 세션으로만 가리킬 수 있다
const expressionsOf = (source: 'scenario' | 'session', sourceId: number) =>
  `/expressions/${source}/${sourceId}`;

// 대화 직후 표현 분기 화면
export const scenarioExpressionBranchPath = (
  scenarioId: number,
  date?: string | null,
) => withDate(`${expressionsOf('scenario', scenarioId)}/branch`, date);

// 표현 하나를 배우는 화면
export const scenarioExpressionPath = (
  scenarioId: number,
  expressionId: number,
  date?: string | null,
) => withDate(`${expressionsOf('scenario', scenarioId)}/${expressionId}`, date);

// 스몰톡은 "어느 날 카드"라는 개념이 없어 날짜를 달지 않는다
export const sessionExpressionBranchPath = (sessionId: number) =>
  `${expressionsOf('session', sessionId)}/branch`;

export const sessionExpressionPath = (
  sessionId: number,
  expressionId: number,
) => `${expressionsOf('session', sessionId)}/${expressionId}`;

// 주소의 ?date=를 읽는다. yyyy-MM-dd가 아니면 없는 것으로 본다 —
// 손으로 고친 주소가 그대로 조회로 흘러가면 백엔드가 400을 준다
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const readDateParam = (searchParams: URLSearchParams) => {
  const date = searchParams.get('date');
  return date && DATE_PATTERN.test(date) ? date : undefined;
};
