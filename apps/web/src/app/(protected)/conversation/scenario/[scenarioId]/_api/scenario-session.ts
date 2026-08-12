// 시나리오 대화 세션 API — 시작·발화 제출 (백엔드 시나리오 세션 엔드포인트 미러)
// 발화 제출 URL(/sessions/{id}/messages)은 중립적으로 생겼지만 스몰톡은 전용 엔드포인트
// (/free-talk/...)를 쓰므로 사실상 시나리오 전용이다. 소속은 URL 모양이 아니라 소비자로 정한다.
import type {
  CurrentMessage,
  InputType,
  NextMessage,
  SubmittedMessage,
} from '@/features/conversation/api/session';
import { api } from '@/shared/api/client';
// ttsVoice는 재생(useTts)과 같은 타입을 공유한다
import type { TtsVoice } from '@/shared/tts/voice';

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

export interface SessionMessageSubmitResponse {
  sessionId: number;
  submittedMessage: SubmittedMessage;
  // 다음 AI 발화. 대화가 끝나는(progress.completed) 턴에는 다음 질문 대신 종료 메시지가 담겨 온다.
  // (둘 다 재생 대상이라 FE는 nextMessage 유무로 발화 여부를, completed로 종료 여부를 판단한다)
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
