// 화면 주소 상수 — 여러 곳에서 같은 경로를 문자열로 반복하지 않도록 한 곳에 모은다
// 스몰톡 탭이 생기면 복귀 목적지가 둘로 갈리는데, 그 분기도 여기서 시작한다
export const SCENARIO_PATH = '/scenario';
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

// 대화 화면. 지난 날 카드에서 들어가면 그 날짜를 달고 가야 어느 날 카드인지 알 수 있고,
// 나올 때도 그 날로 돌아간다. 오늘이면 붙이지 않는다
export const conversationPath = (scenarioId: number, date?: string | null) =>
  date
    ? `/conversation/${scenarioId}?date=${date}`
    : `/conversation/${scenarioId}`;

// 대화 직후 표현 분기 화면. 어느 날 카드에서 온 대화였는지를 이어 나른다
export const expressionBranchPath = (
  scenarioId: number,
  date?: string | null,
) =>
  date
    ? `/expressions/${scenarioId}/branch?date=${date}`
    : `/expressions/${scenarioId}/branch`;

// 표현 하나를 배우는 화면
export const expressionPath = (
  scenarioId: number,
  expressionId: number,
  date?: string | null,
) =>
  date
    ? `/expressions/${scenarioId}/${expressionId}?date=${date}`
    : `/expressions/${scenarioId}/${expressionId}`;

// 주소의 ?date=를 읽는다. yyyy-MM-dd가 아니면 없는 것으로 본다 —
// 손으로 고친 주소가 그대로 조회로 흘러가면 백엔드가 400을 준다
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const readDateParam = (searchParams: URLSearchParams) => {
  const date = searchParams.get('date');
  return date && DATE_PATTERN.test(date) ? date : undefined;
};
