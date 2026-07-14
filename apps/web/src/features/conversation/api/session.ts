// 대화 세션 API — 시작·발화 제출·종료 (백엔드 세션 엔드포인트 미러)
// FE는 BE만 호출하고, BE가 내부에서 AI 서버를 오케스트레이션한다.
import { api } from '@/shared/api/client';
// ttsVoice는 재생(useTts)과 같은 타입을 공유한다
import type { TtsVoice } from '@/shared/lib/tts/tts.types';

export type InputType = 'VOICE' | 'TEXT' | 'GENERATED';

// 시작 응답의 currentMessage — AI 선발화 시 첫 질문(속마음까지 포함)
export interface CurrentMessage {
  messageId: number;
  turnNumber: number;
  messageSequence: number;
  role: string;
  content: string;
  translatedContent: string;
  innerThought: string;
  innerThoughtType: string;
}

export interface SessionProgress {
  currentTurnNumber: number;
  currentMessageSequenceNumber: number;
  totalQuestionCount: number;
  completed: boolean;
}

export interface SessionStartResponse {
  sessionId: number;
  scenarioId: number;
  sessionType: string;
  firstSpeaker: 'AI' | 'USER';
  userOpeningInstruction: string | null;
  ttsVoice: TtsVoice | null;
  currentMessage: CurrentMessage | null;
  progress: SessionProgress;
}

export type ProcessingStatus = 'PREPARING' | 'COMPLETED' | 'FAILED';

// 제출한 내 발화에 대한 상대 반응 — 속마음은 비동기 생성이라 제출 시점엔 아직 준비 중(PREPARING)일 수 있다.
// PREPARING이면 inner-thought 폴링으로 채운다.
export interface SubmittedMessage {
  messageId: number;
  turnNumber: number;
  messageSequence: number;
  role: string;
  feedbackProcessingStatus: ProcessingStatus;
  innerThoughtProcessingStatus: ProcessingStatus;
  innerThought: string;
  innerThoughtType: string;
}

// 속마음 폴링 응답 — 준비되면(COMPLETED) 속마음이 채워진다.
// 아직 준비 중(PREPARING)이면 두 필드가 null이라 여기만 nullable이다.
export interface SessionInnerThoughtResponse {
  processingStatus: ProcessingStatus;
  innerThought: string | null;
  innerThoughtType: string | null;
}

// 다음 AI 질문 — 속마음 없이 발화 내용만
export interface NextMessage {
  messageId: number;
  turnNumber: number;
  messageSequence: number;
  role: string;
  content: string;
  translatedContent: string;
}

export interface SessionMessageSubmitResponse {
  sessionId: number;
  submittedMessage: SubmittedMessage;
  // 스웨거상 nullable 미선언이나, 대화가 끝난(progress.completed) 턴에선 다음 질문이 없다.
  nextMessage: NextMessage | null;
  progress: SessionProgress;
}

// 시나리오 세션 시작 — sessionId·선발화자·오프닝·TTS 보이스를 받는다
export const startSession = (scenarioId: number) =>
  api.post<SessionStartResponse>(`/api/v1/scenarios/${scenarioId}/sessions`);

// 유저 발화 제출 — 상대 속마음·다음 질문·진행 상태를 받는다
export const submitMessage = (
  sessionId: number,
  content: string,
  inputType: InputType,
) =>
  api.post<SessionMessageSubmitResponse>(
    `/api/v1/sessions/${sessionId}/messages`,
    { content, inputType },
  );

// 속마음 폴링 — 제출 시 PREPARING이면 준비될 때까지 이 엔드포인트로 조회한다
export const getInnerThought = (sessionId: number, messageId: number) =>
  api.get<SessionInnerThoughtResponse>(
    `/api/v1/sessions/${sessionId}/messages/${messageId}/inner-thought`,
  );

// 세션 중도 종료
export const endSession = (sessionId: number) =>
  api.patch<void>(`/api/v1/sessions/${sessionId}/end`);
