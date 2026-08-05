// 화면 주소 상수 — 여러 곳에서 같은 경로를 문자열로 반복하지 않도록 한 곳에 모은다
// 스몰톡 탭이 생기면 복귀 목적지가 둘로 갈리는데, 그 분기도 여기서 시작한다
export const SCENARIO_PATH = '/scenario';

// 시나리오 리마인더 알림의 utm_campaign 값 — 만드는 곳(알림 예약)과 읽는 곳(계측·램프 게이트)이 같이 쓴다
export const DAILY_REMINDER_CAMPAIGN = 'daily_reminder';
export const SMALLTALK_PATH = '/smalltalk';

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

// 대화 화면. 어느 날 카드인지 알아야 그 날 배정을 받아 오고, 나올 때도 그 날로 돌아간다
export const conversationPath = (scenarioId: number, date?: string | null) =>
  withDate(`/conversation/${scenarioId}`, date);

// 대화 직후 표현 분기 화면
export const expressionBranchPath = (
  scenarioId: number,
  date?: string | null,
) => withDate(`/expressions/${scenarioId}/branch`, date);

// 표현 하나를 배우는 화면
export const expressionPath = (
  scenarioId: number,
  expressionId: number,
  date?: string | null,
) => withDate(`/expressions/${scenarioId}/${expressionId}`, date);

// 주소의 ?date=를 읽는다. yyyy-MM-dd가 아니면 없는 것으로 본다 —
// 손으로 고친 주소가 그대로 조회로 흘러가면 백엔드가 400을 준다
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const readDateParam = (searchParams: URLSearchParams) => {
  const date = searchParams.get('date');
  return date && DATE_PATTERN.test(date) ? date : undefined;
};
