// 소감을 물을 차례인지와 답한 기록을 기기(localStorage)에 남긴다 — 순간마다 딱 한 번만 묻기 위한 순수 모듈
import type {
  SatisfactionAnswer,
  SatisfactionMoment,
  SatisfactionTalk,
} from '@landit/analytics';

import {
  deviceToday,
  readPromptEntry,
  updatePromptEntry,
} from '@/shared/lib/prompt-store';

// 기록은 공용 프롬프트 버킷(landit-prompts)에 satisfaction: 네임스페이스로 남긴다
export { PROMPT_RECORD_KEY } from '@/shared/lib/prompt-store';

interface ImpressionRecord extends Record<string, unknown> {
  // 대화를 마치고 아직 홈에서 소감 시트를 보지 않았다 — 시트를 띄우는 순간 소비한다
  pending?: boolean;
  // 그 대화를 마친 날(기기 기준 yyyy-MM-dd) — 오늘 마친 차례만 친다.
  // 마치고 홈에 안 들른 채 앱을 껐다가 다른 날 열면 "방금 마침"이 아니다
  pendingOn?: string;
  // 한 번 답하면 다시 묻지 않는다. 닫기(dismiss)도 답이다
  answer?: SatisfactionAnswer;
  // 답한 날(기기 기준 yyyy-MM-dd) — 리뷰는 답한 날과 다른 날에만 청한다
  answeredOn?: string;
}

const entryKey = (moment: SatisfactionMoment) => `satisfaction:${moment}`;

const update = (moment: SatisfactionMoment, patch: Partial<ImpressionRecord>) =>
  updatePromptEntry<ImpressionRecord>(entryKey(moment), patch);

const read = (moment: SatisfactionMoment) =>
  readPromptEntry<ImpressionRecord>(entryKey(moment));

const TALKS: SatisfactionTalk[] = ['scenario', 'smalltalk'];

const today = deviceToday;

// 대화를 마쳤다 — 홈에 돌아오면 물을 차례라고 남긴다
export const markTalkCompleted = (talk: SatisfactionTalk) =>
  update(talk, { pending: true, pendingOn: today() });

// 오늘 마친 차례인가 — 묵은 차례(마치고 홈에 안 들른 채 날이 바뀐 것)는 치지 않는다
const completedToday = (record?: ImpressionRecord) =>
  record?.pending === true && record.pendingOn === today();

// 홈에서 시트를 하나 띄웠다 — 쌓여 있던 차례를 모두 지운다. 리뷰 요청은 대화 종류를 가리지 않아,
// 하나만 지우면 남은 차례로 다른 시트가 곧바로 이어 뜬다
export const consumeAllTalkPending = () => {
  for (const talk of TALKS) update(talk, { pending: false });
};

// 답한 날을 함께 남긴다 — 완료일 수만 보면 배포 전부터 쓰던 사람은 이미 이틀을 넘겨서
// 좋았다고 한 그날 또 대화해도 리뷰가 뜬다. 기기 날짜라 자정 경계가 서버와 어긋날 수 있지만,
// 그래봐야 하루 이르거나 늦게 청하는 정도다
export const recordSatisfactionAnswer = (
  moment: SatisfactionMoment,
  answer: SatisfactionAnswer,
) => update(moment, { answer, answeredOn: today() });

export const readSatisfactionAnswer = (
  moment: SatisfactionMoment,
): SatisfactionAnswer | null => read(moment)?.answer ?? null;

// 첫 소감 — 그 대화를 막 마쳤고 아직 답한 적 없을 때만. 답이 있으면 몇 번을 마쳐도 묻지 않는다
export const shouldAskSatisfaction = (talk: SatisfactionTalk) => {
  const record = read(talk);
  return completedToday(record) && record?.answer === undefined;
};

// 리뷰 요청 — 소감에서 좋았다고 한 사람에게만, 다른 날 다시 와서 대화(종류 무관)를 마쳤을 때 한 번.
// 완료일 숫자는 부르는 쪽이 넘긴다(스트릭 달력) — 이 슬라이스는 스트릭을 모른다
export const shouldAskReview = (streak: {
  activeToday: boolean;
  totalActiveDays: number;
}) => mayAskReview() && streak.activeToday && streak.totalActiveDays >= 2;

// 위 조건 중 로컬만으로 알 수 있는 부분 — 스트릭을 굳이 조회할 필요가 있는지 먼저 거른다.
// 어느 대화든 방금 마쳤고, 지난 날 좋았다고 답한 적이 있고, 아직 리뷰를 청하지 않았을 때.
// 좋았다고 한 소감이 둘이면 그중 하나만 지난 날이어도 된다
export const mayAskReview = () => {
  const records = TALKS.map(read);
  return (
    records.some(completedToday) &&
    records.some((r) => r?.answer === 'good' && r.answeredOn !== today()) &&
    read('review')?.answer === undefined
  );
};
