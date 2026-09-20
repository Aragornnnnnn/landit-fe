// 스몰톡 API — 주소는 백엔드가 부르는 이름(free-talk) 그대로, 코드 어휘는 우리 이름(스몰톡)으로 쓴다.
// 세션 타입을 가리지 않는 종료·속마음은 여기 없다 — features/conversation의 공용 세션 API에 있다.
import type {
  ConversationCharacter,
  CurrentMessage,
  InputType,
  NextMessage,
  SubmittedMessage,
} from '@/features/conversation/api/session';
import type { Partner } from '@/features/conversation/model/character-look';
import { api } from '@/shared/api/client';

// 상대의 감정 — 저장된 값이 없으면 비어 온다 (백엔드 문자열 그대로, 좁히기는 소비 지점에서)
export type SmallTalkEmotion = string | null;

// 스몰톡 첫 질문은 내 발화 전에 나와 속마음이 없다 — 대신 상대의 감정이 실린다
export interface SmallTalkCurrentMessage extends CurrentMessage {
  emotion: SmallTalkEmotion;
}

// 다음 발화에도 감정이 실린다 (시나리오엔 없는 축)
export interface SmallTalkNextMessage extends NextMessage {
  emotion: SmallTalkEmotion;
}

export interface SmallTalkTopic {
  topicId: number;
  displayName: string;
  displayOrder: number;
}

// 스몰톡 홈이 한 번에 받는 것 — 고를 주제와 오늘 남은 발화 예산
export interface SmallTalkMainResponse {
  topics: SmallTalkTopic[];
  dailySpeakingTimeLimitMs: number;
  usedSpeakingTimeMs: number;
  remainingSpeakingTimeMs: number;
  // 오늘 예산을 다 썼는지는 서버가 판정한다 — 남은 시간으로 프론트가 유추하지 않는다
  canStart: boolean;
}

export const getSmallTalkTopics = () =>
  api.get<SmallTalkMainResponse>('/api/v1/free-talk/topics');

// 누가 먼저 말하는가 — 주제를 고르면 상대가(AI_FIRST), 직접 걸면 내가(USER_FIRST) 먼저다
export type SmallTalkStartMode = 'AI_FIRST' | 'USER_FIRST';

export interface SmallTalkSessionStartResponse {
  sessionId: number;
  sessionType: string;
  startMode: SmallTalkStartMode;
  // 이 대화의 상대. 페르소나와 TTS 음성이 여기서 갈린다
  character: ConversationCharacter;
  // AI 선시작의 주제명. 내가 먼저 시작하면 null이고, 대화 중 서버가 주제를 추론해 채운다
  title: string | null;
  // 하루 총량(잔량이 아니다) — 잔량은 홈 조회와 매 제출의 progress에만 있다
  speakingTimeLimitMs: number;
  // AI 선시작의 첫 발화. 내가 먼저 시작하면 null
  currentMessage: SmallTalkCurrentMessage | null;
}

// 이 발화로 대화가 어떻게 되는가 — 이어가거나, 종료 의사를 확인받거나, 끝난다.
// EXIT_CONFIRMATION_REQUIRED면 다음 발화(nextMessage)도 속마음도 없다. exit-decision을 보내야 대화가 풀린다
export type SmallTalkTurnStatus =
  'CONTINUE' | 'EXIT_CONFIRMATION_REQUIRED' | 'COMPLETED';

export type SmallTalkSessionStatus =
  'IN_PROGRESS' | 'AWAITING_EXIT_DECISION' | 'COMPLETED';

// 맞춤 표현은 대화가 끝난 뒤 서버가 따로 만든다 — 준비될 때까지 PREPARING이다
export type ExpressionGenerationStatus = 'PREPARING' | 'READY' | 'FAILED';

// 그 대화의 표현을 얼마나 배웠는가
export type ExpressionLearningStatus =
  'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface SmallTalkProgress {
  sessionStatus: SmallTalkSessionStatus;
  // 이 대화에서 말한 시간 (오늘 누적인 usedSpeakingTimeMs와 다르다)
  accumulatedSpeakingDurationMs: number;
  speakingTimeLimitMs: number;
  usedSpeakingTimeMs: number;
  remainingSpeakingTimeMs: number;
  expressionGenerationStatus: ExpressionGenerationStatus;
}

export interface SmallTalkMessageSubmitResponse {
  sessionId: number;
  title: string | null;
  turnStatus: SmallTalkTurnStatus;
  // 스몰톡은 메시지별 피드백을 만들지 않아 공용 계약 그대로다 (시나리오만 피드백 상태가 더 온다)
  submittedMessage: SubmittedMessage;
  // 다음 AI 발화. 종료(COMPLETED) 턴에는 작별 인사가 담겨 온다
  nextMessage: SmallTalkNextMessage | null;
  progress: SmallTalkProgress;
}

export interface SmallTalkMessageSubmitRequest {
  // 재전송 판별용 UUID — 같은 값으로 다시 보내면 서버가 이전 결과를 그대로 돌려준다
  clientMessageId: string;
  content: string;
  inputType: InputType;
  utteranceDurationMs: number;
  // 발화 시간을 다 써서 끊었는가. 서버는 참고만 하고 종료 판단은 자기 잔량으로 한다
  timeLimitReached: boolean;
}

export type SmallTalkExitDecision = 'CONTINUE' | 'END';

// 스몰톡 세션 시작 — 상대의 첫 발화까지 만들어 오므로(AI 선시작) 응답이 느리다.
// 상대(characterId)는 필수다 — 서버가 그 값으로 페르소나와 음성을 정한다
export const startSmallTalkSession = (body: {
  startMode: SmallTalkStartMode;
  topicId?: number;
  characterId: Partner;
}) =>
  api.post<SmallTalkSessionStartResponse>('/api/v1/free-talk/sessions', body);

// 유저 발화 제출 — 상대 속마음·다음 발화·진행 상태를 받는다
export const submitSmallTalkMessage = (
  sessionId: number,
  body: SmallTalkMessageSubmitRequest,
) =>
  api.post<SmallTalkMessageSubmitResponse>(
    `/api/v1/free-talk/sessions/${sessionId}/messages`,
    body,
  );

// 대화가 끝난 뒤의 그 대화 한 건 — 완료된 세션만 준다(진행 중이면 404).
// 대화 직후 축하 화면과 지난 스몰톡 상세가 같은 응답을 다르게 그린다
export interface SmallTalkSessionDetailResponse {
  sessionId: number;
  // 서버가 대화 내용에서 뽑은 제목. 아직 못 정했으면 null
  title: string | null;
  startedAt: string;
  completedAt: string;
  userSpeakingDurationMs: number;
  messages: SmallTalkHistoryMessage[];
  expressionGenerationStatus: ExpressionGenerationStatus;
  expressionLearningStatus: ExpressionLearningStatus;
  // 이 대화에서 만들어진 표현. 생성이 끝나기 전(PREPARING)에는 비어 있다
  expressions: SmallTalkSessionExpression[];
  // 교정(더 자연스러운 말)이 붙은 사용자 메시지 수. 기록 상세의 채팅 아이콘 뱃지가 이 수를 쓴다(뱃지는 후속 PR)
  correctionCount: number;
}

// 교정은 대화가 끝난 뒤 서버가 사용자 메시지마다 만든다 — 준비될 때까지 PREPARING이다
export type CorrectionStatus = 'COMPLETED' | 'PREPARING' | 'FAILED';

// 더 자연스러운 말 — 그 턴에서 고른 한 문장을 어떻게 고치면 좋은지
export interface SmallTalkCorrection {
  originalSentence: string;
  betterSentence: string;
  // 한국어 이유 한 줄
  reason: string;
  // 실수 패턴 코드. 화면엔 안 보이고 참고용이다
  mistakePattern: string;
  // 장기기억을 근거로 고친 경우의 근거 문구("9/13 스몰톡에서 말한 헬스장"). 아니면 null
  memoryTag: string | null;
}

// 배운 표현을 이 메시지에서 실제로 썼다
export interface SmallTalkReusedExpression {
  expressionId: number;
  // 표현 원형
  text: string;
  // 원문(content) 안에서 밑줄 그을 구절
  matchedText: string;
}

export interface SmallTalkHistoryMessage {
  messageId: number;
  turnNumber: number;
  messageSequence: number;
  role: string;
  content: string;
  translatedContent: string | null;
  emotion: string | null;
  innerThought: string | null;
  innerThoughtType: string | null;
  // 아래 셋은 사용자 메시지에만 온다 — AI 메시지엔 필드 자체가 없다
  correctionStatus?: CorrectionStatus;
  // 고칠 게 없거나(COMPLETED) 만들다 실패했으면(FAILED) null
  correction?: SmallTalkCorrection | null;
  reusedExpression?: SmallTalkReusedExpression | null;
}

export interface SmallTalkSessionExpression {
  expressionId: number;
  displayOrder: number;
  targetExpressionText: string;
  baseExpressionMeaningText: string;
  completed: boolean;
  // 이전 스몰톡에서 같은 표현을 추천받았던 마지막 시각. 처음 만나는 표현이면 null
  lastRecommendedAt: string | null;
}

// 지난 스몰톡 목록 — 완료한 대화만 최신순으로 온다
export interface SmallTalkSessionListResponse {
  items: SmallTalkSessionSummary[];
  page: number;
  size: number;
  hasNext: boolean;
}

export interface SmallTalkSessionSummary {
  sessionId: number;
  title: string | null;
  startedAt: string;
  completedAt: string;
  userSpeakingDurationMs: number;
  expressionGenerationStatus: ExpressionGenerationStatus;
  expressionLearningStatus: ExpressionLearningStatus;
  expressionCount: number;
  completedExpressionCount: number;
}

export const getSmallTalkSessions = (page = 0, size = 20) =>
  api.get<SmallTalkSessionListResponse>(
    `/api/v1/free-talk/sessions?page=${page}&size=${size}`,
  );

export const getSmallTalkSession = (sessionId: number) =>
  api.get<SmallTalkSessionDetailResponse>(
    `/api/v1/free-talk/sessions/${sessionId}`,
  );

// 표현 생성이 실패했을 때 다시 만들어 달라고 한다 — 접수만 하고(202) 생성은 뒤에서 돈다
export const retrySmallTalkExpressions = (sessionId: number) =>
  api.post<{
    sessionId: number;
    expressionGenerationStatus: ExpressionGenerationStatus;
  }>(`/api/v1/free-talk/sessions/${sessionId}/expressions/retry`);

// 종료 의사 확인에 대한 답 — 응답 모양은 발화 제출과 같아서 대화가 그대로 이어진다
export const decideSmallTalkExit = (
  sessionId: number,
  body: { submittedMessageId: number; decision: SmallTalkExitDecision },
) =>
  api.post<SmallTalkMessageSubmitResponse>(
    `/api/v1/free-talk/sessions/${sessionId}/exit-decision`,
    body,
  );

// 오늘의 스몰톡 — 끝난 대화의 요약. 점수·별점 없이 지난번과의 비교와 기억·재사용의 순간을 돌려준다.
// growth만 없을 수 있고(null), reusedExpressions·followUp은 늘 오되 아직 만드는 중이면 pending이다
export interface SmallTalkSummaryResponse {
  sessionId: number;
  title: string;
  // 첫 스몰톡이면 comparison.previous는 전부 0, growth는 null
  firstSession: boolean;
  headline: SmallTalkSummaryHeadline;
  comparison: SmallTalkSummaryComparison;
  // 실수 기억 카드. 직전 세션에 교정받은 패턴이 이번에 다시 나왔을 때만. 여러 패턴이어도 하나
  growth: SmallTalkSummaryGrowth | null;
  reusedExpressions: SmallTalkSummaryReusedExpressions;
  followUp: SmallTalkSummaryFollowUp;
  // 교정이 붙은 사용자 메시지 수 (세션 상세의 correctionCount와 같은 값)
  correctionCount: number;
}

// 래디 포즈 — POINT(기본), NORMAL(반복 실수), WAVE_SMILE(첫 스몰톡). 서버 문자열 그대로 받는다
export type SmallTalkSummaryPose = string;

export interface SmallTalkSummaryHeadline {
  // 첫 문장(사실 + 숫자). 닉네임이 들어갈 수 있어 길이 제한 없음
  text: string;
  // 둘째 문장(의미 한 마디)
  subline: string;
  pose: SmallTalkSummaryPose;
}

export interface SmallTalkSummaryMetrics {
  // 사용자 발화 시간 합(ms)
  speakingMs: number;
  // 사용자 턴 수
  turnCount: number;
  // 한 턴 최대 단어 수
  maxWordsInTurn: number;
}

export interface SmallTalkSummaryComparison {
  // 직전 완료 세션. 첫 스몰톡이면 둘 다 null
  previousSessionId: number | null;
  // yyyy-MM-dd
  previousDate: string | null;
  current: SmallTalkSummaryMetrics;
  // 첫 스몰톡이면 모두 0
  previous: SmallTalkSummaryMetrics;
}

export interface SmallTalkSummaryGrowth {
  // 실수 패턴 코드(PAST_TENSE, ARTICLE, …). 화면엔 patternLabel만 쓴다
  pattern: string;
  // 화면용 한국어 이름 (과거형)
  patternLabel: string;
  // true = 오늘은 맞음(성공), false = 오늘도 틀림(반복)
  succeeded: boolean;
  previousDate: string;
  previousSentence: string;
  // 직전 문장에서 빨강 취소선 처리할 구절
  previousWrongSpan: string;
  currentSentence: string;
  // 이번 문장에서 강조할 구절. 성공이면 초록, 반복이면 빨강
  currentSpan: string;
  previousCount: number;
  // 성공이면 0
  currentCount: number;
}

export interface SmallTalkSummaryReusedExpressions {
  // true면 종료 후 잡 미완료. items는 빈 배열이며 준비될 때까지 다시 묻는다
  pending: boolean;
  // 전부 내려준다. 화면은 2개까지 펼치고 나머지는 접는다
  items: SmallTalkSummaryReusedExpression[];
}

export interface SmallTalkSummaryReusedExpression {
  expressionId: number;
  // 표현(칩)
  text: string;
  // 대표 뜻 하나
  meaning: string;
  // 배운 곳. 프리톡이면 "M월 D일 「제목」", 시나리오면 "시나리오 「제목」"
  sourceLabel: string;
  messageId: number;
  // 이 표현을 쓴 사용자 메시지 원문
  quotedSentence: string;
  // 원문 안에서 굵게 처리할 구절
  matchedText: string;
}

export interface SmallTalkSummaryFollowUp {
  // true면 장기기억 잡 미완료. 준비될 때까지 다시 묻는다
  pending: boolean;
  // CUT_OFF, PAST_EVENT, CONCERN, GOAL, MOOD, HOBBY, NONE. NONE이어도 블록은 그린다
  triggerType: string;
  // 굵게 나갈 질문(반말). NONE이면 기본 문구
  question: string;
  // 회색으로 나갈 초대 한 줄
  invite: string;
}

// 오늘의 스몰톡 요약 — 완료(COMPLETED)된 세션만 준다. 진행 중이거나 종료 확인 대기면 409
export const getSmallTalkSummary = (sessionId: number) =>
  api.get<SmallTalkSummaryResponse>(
    `/api/v1/free-talk/sessions/${sessionId}/summary`,
  );
