// 소감·리뷰 요청을 물을 차례인지와 답한 기록을 기기(localStorage)에 남긴다 — 소감은 딱 한 번, 리뷰는 남길 때까지 간격을 두고
import type {
  ReviewTrigger,
  SatisfactionAnswer,
  SatisfactionMoment,
  SatisfactionTalk,
} from '@landit/analytics';

import { getDeviceToday } from '@/shared/lib/device-today';
import { readPromptEntry, updatePromptEntry } from '@/shared/lib/prompt-store';

// 기록은 공용 프롬프트 버킷(landit-prompts)에 satisfaction: 네임스페이스로 남긴다
export { PROMPT_RECORD_KEY } from '@/shared/lib/prompt-store';

interface ImpressionRecord {
  // 마치고 아직 홈에서 시트를 보지 않았다 — 시트를 띄우는 순간 소비한다
  pending?: boolean;
  // 마친 날(기기 기준 yyyy-MM-dd) — 오늘 마친 차례만 친다.
  // 마치고 홈에 안 들른 채 앱을 껐다가 다른 날 열면 "방금 마침"이 아니다
  pendingOn?: string;
  // 마지막 답. 소감은 한 번 답하면 다시 묻지 않는다(닫기도 답이다). 리뷰는 이미 남겼다(already_done)만 끝이다
  answer?: SatisfactionAnswer;
  // 답한 날(기기 기준 yyyy-MM-dd) — 리뷰 재요청 간격을 세는 기준
  answeredOn?: string;
  // 리뷰 요청만 — 띄운 횟수와 마지막으로 띄운 날. 하루 한 번·최대 4번을 세는 근거
  attempt?: number;
  shownOn?: string;
}

// 리뷰 요청을 띄우게 하는 완료 — 소감을 묻는 대화 둘과, 소감은 안 묻지만 완료는 치는 표현 학습
type CompletedActivity = SatisfactionTalk | 'expression';
type RecordKey = SatisfactionMoment | 'expression';

const entryKey = (key: RecordKey) => `satisfaction:${key}`;

const update = (key: RecordKey, patch: Partial<ImpressionRecord>) =>
  updatePromptEntry<ImpressionRecord>(entryKey(key), patch);

const read = (key: RecordKey) =>
  readPromptEntry<ImpressionRecord>(entryKey(key));

const TALKS: SatisfactionTalk[] = ['scenario', 'smalltalk'];
const ACTIVITIES: CompletedActivity[] = [...TALKS, 'expression'];

// 리뷰 요청은 처음 1번 + 재요청 3번. 재요청은 마지막으로 답한 날(닫기·스토어행)부터 이만큼은 쉰다(최소 쉼, 예약이 아니다).
// 근거는 리뷰 시트를 닫은 사람이 N일 뒤에도 다시 대화하는 비율 — docs/review-prompt-plan.md
const REVIEW_MAX_ATTEMPTS = 4;
const REVIEW_RETRY_GAP_DAYS = [2, 4, 6];

const today = getDeviceToday;

const DAY_MS = 24 * 60 * 60 * 1000;

// yyyy-MM-dd 둘 사이 날 수 — 둘 다 UTC 자정으로 읽혀 시차가 끼지 않는다
const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);

// 대화를 마쳤다 — 홈에 돌아오면 물을 차례라고 남긴다
export const markTalkCompleted = (talk: SatisfactionTalk) =>
  update(talk, { pending: true, pendingOn: today() });

// 표현 학습을 마쳤다 — 소감은 안 묻지만 리뷰 요청의 완료로는 친다
export const markExpressionCompleted = () =>
  update('expression', { pending: true, pendingOn: today() });

// 오늘 마친 차례인가 — 묵은 차례(마치고 홈에 안 들른 채 날이 바뀐 것)는 치지 않는다
const completedToday = (record?: ImpressionRecord) =>
  record?.pending === true && record.pendingOn === today();

// 홈에서 시트를 하나 띄웠다 — 쌓여 있던 차례를 모두 지운다. 리뷰 요청은 완료 종류를 가리지 않아,
// 하나만 지우면 남은 차례로 다른 시트가 곧바로 이어 뜬다. 소감 시트가 뜬 그 홈 진입에서 리뷰가 이어 뜨지 않는 것도 이 덕이다
export const consumeAllPending = () => {
  for (const activity of ACTIVITIES) update(activity, { pending: false });
};

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

// 배포 전 기록은 attempt가 없다 — 답이 남아 있으면 한 번은 띄운 것이다
const reviewAttempt = (record?: ImpressionRecord) =>
  record?.attempt ?? (record?.answer === undefined ? 0 : 1);

// 리뷰 시트를 띄운 횟수 — 재요청부터 「이미 남겼어요」를 보여주는 기준
export const readReviewAttempt = () => reviewAttempt(read('review'));

// 지금 띄우는 시트가 몇 번째인가 — 오늘 이미 띄웠으면(같은 날 재마운트) 그 횟수, 아니면 하나 더
export const peekReviewAttempt = () => {
  const review = read('review');
  return review?.shownOn === today()
    ? reviewAttempt(review)
    : reviewAttempt(review) + 1;
};

// 리뷰 시트를 띄웠다 — 횟수와 날을 남긴다. 차례 소비는 부르는 쪽이 따로 한다(consumeAllPending).
// 같은 날 또 불리면(개발 모드의 이펙트 이중 실행, 할인 시트에 밀렸다 다시 뜸) 한 번으로 센다 — 하루 한 번이 규칙이라 횟수도 하루 하나다.
// 이번 호출이 새로 센 것인지 돌려준다 — 노출 계측도 그때만 한 번 찍는다
export const markReviewShown = (): boolean => {
  const review = read('review');
  const counted = review?.shownOn !== today();
  if (counted)
    update('review', { attempt: reviewAttempt(review) + 1, shownOn: today() });
  return counted;
};

// 리뷰 요청 — 좋았다고 한 사람이 무엇이든 막 마쳤을 때. 같은 날이어도 묻되 하루 한 번,
// 답한 날부터 2·4·6일을 쉬고, 네 번 띄웠거나 이미 남겼다고 했으면 다시 묻지 않는다.
// 스토어로 간 것(good)은 끝이 아니다 — 간 사람 4명 중 3명은 안 쓰고 돌아온다. 쓴 사람은 「이미 남겼어요」로 끝낸다
export const shouldAskReview = () => {
  if (!ACTIVITIES.map(read).some(completedToday)) return false;
  if (!TALKS.map(read).some((r) => r?.answer === 'good')) return false;

  const review = read('review');
  if (review?.answer === 'already_done') return false;
  if (review?.shownOn === today()) return false;

  const attempt = reviewAttempt(review);
  if (attempt >= REVIEW_MAX_ATTEMPTS) return false;
  if (attempt === 0) return true;

  // 답 없이 뜨기만 했으면(뜨자마자 앱을 끈 경우) 띄운 날부터 센다
  const since = review?.answeredOn ?? review?.shownOn;
  const gap = REVIEW_RETRY_GAP_DAYS[attempt - 1];
  return since === undefined || daysBetween(since, today()) >= gap;
};

// 무엇을 마치고 와서 뜨는가 — 계측용. 둘 다 마쳤으면 대화를 앞세운다
export const resolveReviewTrigger = (): ReviewTrigger =>
  TALKS.map(read).some(completedToday) ? 'talk' : 'expression';
