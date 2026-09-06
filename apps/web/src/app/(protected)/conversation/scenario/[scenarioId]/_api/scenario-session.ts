// 시나리오 대화 세션 API — 시작·발화 제출 (백엔드 시나리오 세션 엔드포인트 미러)
// 발화 제출 URL(/sessions/{id}/messages)은 중립적으로 생겼지만 스몰톡은 전용 엔드포인트
// (스몰톡 전용 주소)를 쓰므로 사실상 시나리오 전용이다. 소속은 URL 모양이 아니라 소비자로 정한다.
import type {
  ConversationCharacter,
  CurrentMessage,
  InputType,
  NextMessage,
  ProcessingStatus,
  SubmittedMessage,
} from '@/features/conversation/api/session';
import { api } from '@/shared/api/client';

// 시나리오 첫 질문에는 속마음이 함께 온다 (스몰톡과 달리 이미 오간 맥락 위에서 나온다)
export interface ScenarioTalkCurrentMessage extends CurrentMessage {
  innerThought: string;
  innerThoughtType: string;
  // 첫 고정 질문 음원 — 오프닝은 번들 mp3 즉시 재생을 유지해 아직 읽지 않는다 (세션 응답이 재생 시점보다 늦다)
  questionAudioUrl: string | null;
}

// 다음 AI 발화의 분리 재생 소스 — 맞장구(ttsText)는 프론트가 합성하고, 고정 질문은 미리 만든
// 음원(questionAudioUrl)을 이어 튼다. fixedQuestionText는 질문 구간 립싱크용 질문 원문이다.
// 종료 인사처럼 고정 질문이 없는 발화는 세 값이 비어 오고, 그때는 content 전체를 합성한다
export interface ScenarioTalkNextMessage extends NextMessage {
  ttsText: string | null;
  fixedQuestionText: string | null;
  questionAudioUrl: string | null;
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
  // 시나리오의 상대. 얼굴도 목소리도 openingPreview의 같은 값으로 이미 정해져 있어 여기서는 읽지 않는다
  character: ConversationCharacter;
  sessionType: string;
  firstSpeaker: 'AI' | 'USER';
  userOpeningInstruction: string | null;
  currentMessage: ScenarioTalkCurrentMessage | null;
  progress: ScenarioTalkStartProgress;
}

export interface ScenarioTalkSubmitResponse {
  sessionId: number;
  submittedMessage: ScenarioTalkSubmittedMessage;
  // 다음 AI 발화. 대화가 끝나는(progress.completed) 턴에는 다음 질문 대신 종료 메시지가 담겨 온다.
  // (둘 다 재생 대상이라 FE는 nextMessage 유무로 발화 여부를, completed로 종료 여부를 판단한다)
  nextMessage: ScenarioTalkNextMessage | null;
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
