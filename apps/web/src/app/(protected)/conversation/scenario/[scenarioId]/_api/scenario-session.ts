// 시나리오 대화 세션 API — 시작·발화 제출 (백엔드 시나리오 세션 엔드포인트 미러)
// 발화 제출 URL(/sessions/{id}/messages)은 중립적으로 생겼지만 스몰톡은 전용 엔드포인트
// (스몰톡 전용 주소)를 쓰므로 사실상 시나리오 전용이다. 소속은 URL 모양이 아니라 소비자로 정한다.
import type {
  CurrentMessage,
  InputType,
  NextMessage,
  ProcessingStatus,
  SubmittedMessage,
} from '@/features/conversation/api/session';
import type { Partner } from '@/features/conversation/model/character-look';
import { api } from '@/shared/api/client';
// ttsVoice는 재생(useTts)과 같은 타입을 공유한다
import type { TtsVoice } from '@/shared/tts/voice';

// 시나리오 첫 질문에는 속마음이 함께 온다 (스몰톡과 달리 이미 오간 맥락 위에서 나온다)
export interface ScenarioTalkCurrentMessage extends CurrentMessage {
  innerThought: string;
  innerThoughtType: string;
}

// 시나리오는 메시지별 피드백을 만든다 — 그 생성 상태가 함께 온다
export interface ScenarioTalkSubmittedMessage extends SubmittedMessage {
  feedbackProcessingStatus: ProcessingStatus;
}

// 시작 응답의 진행도 — 아직 주고받은 메시지가 없어 순번이 없다 (백엔드 DTO가 제출 응답과 다른 레코드다)
export interface ScenarioTalkStartProgress {
  currentTurnNumber: number;
  totalQuestionCount: number;
  completed: boolean;
}

// 제출 응답의 진행도 — 방금 오간 메시지의 순번이 붙는다
export interface ScenarioTalkProgress extends ScenarioTalkStartProgress {
  currentMessageSequenceNumber: number;
}

export interface ScenarioTalkStartResponse {
  sessionId: number;
  scenarioId: number;
  // 시나리오의 상대. 얼굴은 openingPreview의 같은 값으로 이미 정해져 있어 여기서는 읽지 않는다
  characterId: Partner | null;
  sessionType: string;
  firstSpeaker: 'AI' | 'USER';
  userOpeningInstruction: string | null;
  ttsVoice: TtsVoice | null;
  currentMessage: ScenarioTalkCurrentMessage | null;
  progress: ScenarioTalkStartProgress;
}

export interface ScenarioTalkSubmitResponse {
  sessionId: number;
  submittedMessage: ScenarioTalkSubmittedMessage;
  // 다음 AI 발화. 대화가 끝나는(progress.completed) 턴에는 다음 질문 대신 종료 메시지가 담겨 온다.
  // (둘 다 재생 대상이라 FE는 nextMessage 유무로 발화 여부를, completed로 종료 여부를 판단한다)
  nextMessage: NextMessage | null;
  progress: ScenarioTalkProgress;
}

// 시나리오 세션 시작 — sessionId·선발화자·오프닝·TTS 보이스를 받는다
export const startScenarioTalkSession = (scenarioId: number) =>
  api.post<ScenarioTalkStartResponse>(
    `/api/v1/scenarios/${scenarioId}/sessions`,
  );

// 유저 발화 제출 — 상대 속마음·다음 질문·진행 상태를 받는다
export const submitScenarioTalkMessage = (
  sessionId: number,
  content: string,
  inputType: InputType,
) =>
  api.post<ScenarioTalkSubmitResponse>(
    `/api/v1/sessions/${sessionId}/messages`,
    { content, inputType },
  );
