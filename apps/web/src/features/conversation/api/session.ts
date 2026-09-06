// 대화 세션 공용 API — 세션 타입 무관 엔드포인트와 공유 응답 부품만 둔다.
// sessionId는 세션 타입 공용 네임스페이스다. 특정 대화 유형만 쓰는 엔드포인트는
// 그 유형의 feature(api/)에 둔다 — 소속 기준은 URL 모양이 아니라 실제 소비자.
// FE는 BE만 호출하고, BE가 내부에서 AI 서버를 오케스트레이션한다.
import { api } from '@/shared/api/client';
import type { TtsVoice } from '@/shared/tts/voice';

import type { Partner } from '../model/character-look';

export type InputType = 'VOICE' | 'TEXT' | 'GENERATED';

// 대화 상대 — 시나리오·스몰톡이 같은 모양으로 받는다 (백엔드 ConversationCharacterResponse 미러).
// 얼굴(characterId)과 목소리(ttsVoice)는 한 캐릭터의 두 면이라 늘 함께 온다.
// 음성이 미설정이거나 비활성이면 캐릭터는 남고 ttsVoice만 null이다
export interface ConversationCharacter {
  characterId: Partner | null;
  ttsVoice: TtsVoice | null;
}

// 시작 응답의 currentMessage — AI 선발화 시 첫 질문.
// 여기 있는 건 두 대화가 함께 쓰는 최소 계약이다. 대화마다 더 오는 필드는 그 대화의 api/에서 얹는다
export interface CurrentMessage {
  messageId: number;
  turnNumber: number;
  messageSequence: number;
  role: string;
  content: string;
  translatedContent: string;
}

export type ProcessingStatus = 'PREPARING' | 'COMPLETED' | 'FAILED';

// 제출한 내 발화에 대한 상대 반응 — 속마음은 비동기 생성이라 제출 시점엔 아직 준비 중(PREPARING)일 수 있다.
// PREPARING이면 inner-thought 폴링으로 채운다. 준비 전에는 속마음 두 필드가 비어 온다
export interface SubmittedMessage {
  messageId: number;
  turnNumber: number;
  messageSequence: number;
  role: string;
  innerThoughtProcessingStatus: ProcessingStatus;
  innerThought: string | null;
  innerThoughtType: string | null;
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

// 속마음 폴링 — 제출 시 PREPARING이면 준비될 때까지 이 엔드포인트로 조회한다
export const getInnerThought = (sessionId: number, messageId: number) =>
  api.get<SessionInnerThoughtResponse>(
    `/api/v1/sessions/${sessionId}/messages/${messageId}/inner-thought`,
  );

// 세션 중도 종료
export const endSession = (sessionId: number) =>
  api.patch<void>(`/api/v1/sessions/${sessionId}/end`);
