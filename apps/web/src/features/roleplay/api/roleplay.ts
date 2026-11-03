// 롤플레이 API — 백엔드(LAN-803) /api/v1/roleplays 응답을 그대로 받는다. 가공은 쓰는 자리에서 한다.
// 대화 부품(첫 발화·다음 발화·교정·요약 블록)은 스몰톡과 같은 계약이라 스몰톡 타입을 그대로 쓴다
// 가로 import 사유: 롤플레이는 백엔드에서도 스몰톡(free-talk)의 변형이라 대화 부품 계약을 공유한다
import type {
  ConversationCharacter,
  InputType,
} from '@/features/conversation/api/session';
import type { Partner } from '@/features/conversation/model/character-look';
import type {
  SmallTalkCorrection,
  SmallTalkCurrentMessage,
  SmallTalkNextMessage,
  SmallTalkReusedExpression,
  SmallTalkSummaryComparison,
  SmallTalkSummaryGrowth,
  SmallTalkSummaryHeadline,
  SmallTalkSummaryReusedExpressions,
} from '@/features/small-talk/api/small-talk';
import { api } from '@/shared/api/client';

// 저장(보관함)과 대화 시작이 같은 입력을 받는다 — 제목은 받지 않고 서버가 지어 준다
export interface RoleplaySettingsRequest {
  characterId: Partner;
  userRole: string;
  aiRole: string;
  situation: string;
}

// 내 보관함의 롤플레이 하나
export interface RoleplaySettings {
  id: number;
  // 백엔드 문자열 그대로 — 화면에서 상대로 좁힌다
  characterId: string;
  // 서버가 역할·상황으로 지은 제목
  title: string;
  userRole: string;
  aiRole: string;
  situation: string;
  // 저장한 시각 (LocalDateTime). 목록은 이 값의 최신순으로 온다
  createdAt: string;
}

export interface RoleplaySettingsListResponse {
  items: RoleplaySettings[];
  page: number;
  size: number;
  hasNext: boolean;
}

// 아이디어는 세 칸을 한 조합으로 준다 — 상대(캐릭터)는 바꾸지 않는다
export interface RoleplayIdea {
  id: number;
  title: string;
  userRole: string;
  aiRole: string;
  situation: string;
}

export interface RoleplayIdeaResponse {
  // 고를 예시가 하나도 없으면 null
  idea: RoleplayIdea | null;
}

// 대화 시작 때 고정된 역할 설정
export interface RoleplayScene {
  userRole: string;
  aiRole: string;
  situation: string;
}

// 오늘 쓴 발화 시간과 남은 시간
export interface RoleplayDailyUsage {
  // yyyy-MM-dd
  usageDate: string;
  usedSpeakingDurationMs: number;
  remainingMs: number;
}

export interface RoleplaySessionStartResponse {
  sessionId: number;
  sessionType: string;
  character: ConversationCharacter;
  title: string;
  targetLocale: string;
  baseLocale: string;
  // 하루 총량(잔량이 아니다) — 잔량은 usage에 있다
  speakingTimeLimitMs: number;
  usage: RoleplayDailyUsage;
  // 상대가 늘 먼저 말을 건다 — 첫 발화가 항상 온다
  currentMessage: SmallTalkCurrentMessage;
}

// 롤플레이는 종료 확인 단계가 없다 — 이어가거나(CONTINUE), 다른 곳에서 먼저 끝낸 대화면 COMPLETED(다음 발화 없음)다
export type RoleplayTurnStatus = 'CONTINUE' | 'COMPLETED';

export interface RoleplayProgress {
  sessionStatus: string;
  accumulatedSpeakingDurationMs: number;
  speakingTimeLimitMs: number;
  usedSpeakingTimeMs: number;
  remainingSpeakingTimeMs: number;
}

// 속마음이 없는 대화라 제출한 발화의 식별자만 온다
export interface RoleplaySubmittedMessage {
  messageId: number;
  turnNumber: number;
  messageSequence: number;
  role: string;
}

export interface RoleplayMessageSubmitResponse {
  sessionId: number;
  title: string;
  turnStatus: RoleplayTurnStatus;
  submittedMessage: RoleplaySubmittedMessage;
  nextMessage: SmallTalkNextMessage | null;
  progress: RoleplayProgress;
}

export interface RoleplayMessageSubmitRequest {
  // 재전송 판별용 UUID — 같은 값으로 다시 보내면 서버가 이전 결과를 그대로 돌려준다
  clientMessageId: string;
  content: string;
  inputType: InputType;
  utteranceDurationMs: number;
}

// 지난 롤플레이 대화 한 건 — 당시 역할 설정과 주고받은 말
export interface RoleplayHistoryMessage {
  messageId: number;
  turnNumber: number;
  messageSequence: number;
  role: string;
  content: string;
  translatedContent: string | null;
  emotion: string | null;
  // 고칠 게 없었거나 만들다 실패했으면 null — 두 경우를 가르는 상태 값은 오지 않는다
  correction: SmallTalkCorrection | null;
  reusedExpression: SmallTalkReusedExpression | null;
}

export interface RoleplayHistoryDetail {
  sessionId: number;
  title: string;
  characterId: string;
  targetLocale: string;
  baseLocale: string;
  roleplay: RoleplayScene;
  messages: RoleplayHistoryMessage[];
}

// 오늘의 롤플레이 — 스몰톡 요약에서 다음 대화 질문(followUp)만 뺀 모양
export interface RoleplaySummaryResponse {
  sessionId: number;
  title: string;
  // 총평을 아직 계산하지 않았으면 true — 그동안 아래 넷과 correctionCount는 null이다
  pending: boolean;
  firstSession: boolean | null;
  headline: SmallTalkSummaryHeadline | null;
  comparison: SmallTalkSummaryComparison | null;
  growth: SmallTalkSummaryGrowth | null;
  // 늘 온다 — 아직 만드는 중이면 pending이다
  reusedExpressions: SmallTalkSummaryReusedExpressions;
  correctionCount: number | null;
}

const ROLEPLAYS = '/api/v1/roleplays';

// 보관함에 저장 — 서버가 제목을 지어 오므로 응답이 느리다
export const saveRoleplay = (body: RoleplaySettingsRequest) =>
  api.post<RoleplaySettings>(ROLEPLAYS, body);

// 내 보관함 — 최신 저장순. 한 페이지 최대 50개
export const getRoleplays = (page = 0, size = 50) =>
  api.get<RoleplaySettingsListResponse>(
    `${ROLEPLAYS}?page=${page}&size=${size}`,
  );

// 아이디어 하나 — 직전에 받은 것을 빼 달라고 하면 연속으로 같은 게 오지 않는다
export const getRoleplayIdea = (excludeId?: number) =>
  api.get<RoleplayIdeaResponse>(
    excludeId === undefined
      ? `${ROLEPLAYS}/ideas/random`
      : `${ROLEPLAYS}/ideas/random?excludeId=${excludeId}`,
  );

// 저장한 롤플레이로 대화 시작 — 상대의 첫 발화까지 만들어 오므로 응답이 느리다
export const startSavedRoleplaySession = (roleplayId: number) =>
  api.post<RoleplaySessionStartResponse>(`${ROLEPLAYS}/${roleplayId}/sessions`);

export const submitRoleplayMessage = (
  sessionId: number,
  body: RoleplayMessageSubmitRequest,
) =>
  api.post<RoleplayMessageSubmitResponse>(
    `${ROLEPLAYS}/sessions/${sessionId}/messages`,
    body,
  );

// X로 끝내기 — 마무리 발화 없이 지금 완료하고, 교정·요약은 뒤에서 만든다
export const completeRoleplaySession = (sessionId: number) =>
  api.post<void>(`${ROLEPLAYS}/sessions/${sessionId}/complete`);

// 완료한 대화만 준다(진행 중이면 오류)
export const getRoleplaySession = (sessionId: number) =>
  api.get<RoleplayHistoryDetail>(`${ROLEPLAYS}/sessions/${sessionId}`);

export const getRoleplaySummary = (sessionId: number) =>
  api.get<RoleplaySummaryResponse>(
    `${ROLEPLAYS}/sessions/${sessionId}/summary`,
  );
