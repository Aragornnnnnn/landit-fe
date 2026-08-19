// 소감을 물을 차례인지와 답한 기록을 기기(localStorage)에 남긴다 — 순간마다 딱 한 번만 묻기 위한 순수 모듈
import type {
  SatisfactionAnswer,
  SatisfactionMoment,
  SatisfactionTalk,
} from '@landit/analytics';

// 프롬프트류 기록은 키 하나에 JSON으로 모은다 — 물어본 것이 늘어도 키가 흩어지지 않게.
// 온보딩·알림 동의의 기존 키는 그대로 두고, 여기서부터 새로 시작한다
export const PROMPT_RECORD_KEY = 'landit-prompts';

interface ImpressionRecord {
  // 대화를 마치고 아직 홈에서 소감 시트를 보지 않았다 — 시트를 띄우는 순간 소비한다
  pending?: boolean;
  // 한 번 답하면 다시 묻지 않는다. 닫기(dismiss)도 답이다
  answer?: SatisfactionAnswer;
}

type PromptRecords = Record<string, ImpressionRecord | undefined>;

const entryKey = (moment: SatisfactionMoment) => `satisfaction:${moment}`;

const readAll = (): PromptRecords => {
  try {
    const raw = localStorage.getItem(PROMPT_RECORD_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object'
      ? (parsed as PromptRecords)
      : {};
  } catch {
    // 없거나 깨진 값은 기록이 없는 것과 같다 — 한 번 더 묻는 정도라 감수한다
    return {};
  }
};

const update = (
  moment: SatisfactionMoment,
  patch: Partial<ImpressionRecord>,
) => {
  try {
    const all = readAll();
    const key = entryKey(moment);
    all[key] = { ...all[key], ...patch };
    localStorage.setItem(PROMPT_RECORD_KEY, JSON.stringify(all));
  } catch {
    // 저장 실패는 무시 — 다음 대화 뒤에 한 번 더 뜰 뿐이다
  }
};

const read = (moment: SatisfactionMoment) => readAll()[entryKey(moment)];

// 대화를 마쳤다 — 홈에 돌아오면 물을 차례라고 남긴다
export const markTalkCompleted = (talk: SatisfactionTalk) =>
  update(talk, { pending: true });

// 홈에서 소감 시트를 하나 띄웠다 — 같은 완료로 다른 시트가 또 뜨지 않게 차례를 소비한다
export const consumeTalkPending = (talk: SatisfactionTalk) =>
  update(talk, { pending: false });

export const recordSatisfactionAnswer = (
  moment: SatisfactionMoment,
  answer: SatisfactionAnswer,
) => update(moment, { answer });

export const readSatisfactionAnswer = (
  moment: SatisfactionMoment,
): SatisfactionAnswer | null => read(moment)?.answer ?? null;

// 첫 소감 — 그 대화를 막 마쳤고 아직 답한 적 없을 때만. 답이 있으면 몇 번을 마쳐도 묻지 않는다
export const shouldAskSatisfaction = (talk: SatisfactionTalk) => {
  const record = read(talk);
  return record?.pending === true && record.answer === undefined;
};

// 랜딧 소감(별점 유도) — 시나리오 대화를 막 마쳤고, 서버 기준으로 오늘이 두 번째 이상의 완료일이며,
// 첫 소감에서 아쉬웠다고 하지 않았고, 아직 묻지 않았을 때. 같은 날 두 번째 대화는 완료일이 안 늘어 치지 않는다.
// 완료일 숫자는 부르는 쪽이 넘긴다(스트릭 달력) — 이 슬라이스는 스트릭을 모른다
export const shouldAskAppSatisfaction = (streak: {
  activeToday: boolean;
  totalActiveDays: number;
}) => {
  const first = read('scenario');
  return (
    first?.pending === true &&
    first.answer !== 'bad' &&
    read('app')?.answer === undefined &&
    streak.activeToday &&
    streak.totalActiveDays >= 2
  );
};

// 위 조건 중 로컬만으로 알 수 있는 부분 — 스트릭을 굳이 조회할 필요가 있는지 먼저 거른다
export const mayAskAppSatisfaction = () => {
  const first = read('scenario');
  return (
    first?.pending === true &&
    first.answer !== 'bad' &&
    read('app')?.answer === undefined
  );
};
