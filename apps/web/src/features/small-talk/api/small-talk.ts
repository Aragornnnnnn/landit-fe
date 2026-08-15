// 스몰톡 API — 주소는 백엔드가 부르는 이름(free-talk) 그대로, 코드 어휘는 우리 이름(스몰톡)으로 쓴다.
// 세션 타입을 가리지 않는 종료·속마음은 여기 없다 — features/conversation의 공용 세션 API에 있다.
import type {
  CurrentMessage,
  InputType,
  NextMessage,
  SubmittedMessage,
} from '@/features/conversation/api/session';
import { api } from '@/shared/api/client';
import type { TtsVoice } from '@/shared/tts/voice';

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
  // AI 선시작의 주제명. 내가 먼저 시작하면 null이고, 대화 중 서버가 주제를 추론해 채운다
  title: string | null;
  // 하루 총량(잔량이 아니다) — 잔량은 홈 조회와 매 제출의 progress에만 있다
  speakingTimeLimitMs: number;
  ttsVoice: TtsVoice | null;
  // AI 선시작의 첫 발화. 내가 먼저 시작하면 null
  currentMessage: SmallTalkCurrentMessage | null;
}

// 이 발화로 대화가 어떻게 되는가 — 이어가거나, 종료 의사를 확인받거나, 끝난다.
// EXIT_CONFIRMATION_REQUIRED면 다음 발화(nextMessage)도 속마음도 없다. exit-decision을 보내야 대화가 풀린다
export type SmallTalkTurnStatus =
  'CONTINUE' | 'EXIT_CONFIRMATION_REQUIRED' | 'COMPLETED';

export type SmallTalkSessionStatus =
  'IN_PROGRESS' | 'AWAITING_EXIT_DECISION' | 'COMPLETED';

export interface SmallTalkProgress {
  sessionStatus: SmallTalkSessionStatus;
  // 이 대화에서 말한 시간 (오늘 누적인 usedSpeakingTimeMs와 다르다)
  accumulatedSpeakingDurationMs: number;
  speakingTimeLimitMs: number;
  usedSpeakingTimeMs: number;
  remainingSpeakingTimeMs: number;
  expressionGenerationStatus: 'PREPARING' | 'READY' | 'FAILED';
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

// 스몰톡 세션 시작 — 상대의 첫 발화까지 만들어 오므로(AI 선시작) 응답이 느리다
export const startSmallTalkSession = (body: {
  startMode: SmallTalkStartMode;
  topicId?: number;
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

// 종료 의사 확인에 대한 답 — 응답 모양은 발화 제출과 같아서 대화가 그대로 이어진다
export const decideSmallTalkExit = (
  sessionId: number,
  body: { submittedMessageId: number; decision: SmallTalkExitDecision },
) =>
  api.post<SmallTalkMessageSubmitResponse>(
    `/api/v1/free-talk/sessions/${sessionId}/exit-decision`,
    body,
  );
