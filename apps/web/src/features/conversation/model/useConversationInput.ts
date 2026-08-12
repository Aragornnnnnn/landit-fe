'use client';

// 유저 입력 훅 — 마이크 STT(음성)와 키보드 타이핑을 오가며 최종 발화를 다듬어 전달한다 (LAN-141)
// 기본은 마이크(음성, VOICE), 키보드 아이콘을 누르면 타이핑(TEXT)으로 전환한다.
import { useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { haptic } from '@/shared/haptics';
import { reportWarning } from '@/shared/monitoring/report';
import { isMicPermissionDeniedError } from '@/shared/stt/errors';
import { useStt } from '@/shared/stt/useStt';
import { showToast } from '@/shared/ui/toast';

interface ConversationInputOptions {
  canStart: boolean; // 대기(USER_READY)에서만 시작 — 연타 이중 집계 방지
  trackContext: () => { sessionId: number | null; turnIndex: number }; // 계측용 최신값 getter
  onInputStart: () => void; // → USER_SPEAKING_STARTED
  onInputCancel: () => void; // → USER_SPEAKING_CANCELLED
  // 다듬어진 최종 발화 (음성·타이핑 공통) — utteranceDurationMs는 실제로 말한 시간, 타이핑은 0
  onContent: (
    content: string,
    inputType: 'VOICE' | 'TEXT',
    utteranceDurationMs: number,
  ) => void;
}

export const useConversationInput = ({
  canStart,
  trackContext,
  onInputStart,
  onInputCancel,
  onContent,
}: ConversationInputOptions) => {
  const [transcript, setTranscript] = useState('');
  // 입력 수단 — 기본은 마이크(음성), 키보드 아이콘을 누르면 타이핑 모드로 바꾼다
  const [keyboardMode, setKeyboardMode] = useState(false);
  // 마이크 권한이 거부돼 STT를 못 켠 상태 — 설정 유도 안내를 띄운다
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  // 권한 거부는 "결정" 이벤트라 대화당 1회만 — 차단 상태에서 반복 탭할 때마다 찍히지 않게
  const micDeniedTrackedRef = useRef(false);
  // 말하기 시작 시각 — 마이크를 켠 순간부터 최종 텍스트가 올 때까지가 발화 시간이다
  const spokeFromRef = useRef<number | null>(null);

  // 이번 발화에 걸린 시간. 시작 표시가 없으면(취소 후 늦게 온 결과) 0으로 둔다
  const takeUtteranceDuration = () => {
    const spokeFrom = spokeFromRef.current;
    spokeFromRef.current = null;
    return spokeFrom == null ? 0 : Date.now() - spokeFrom;
  };

  // 음성 최종 텍스트 — 비었으면(인식 실패) 마이크 대기로 되돌리고 이유를 알린다. 취소 후엔 오지 않는다(useStt 보장)
  const submitVoice = (raw: string) => {
    const content = raw.trim();
    const utteranceDurationMs = takeUtteranceDuration();
    if (!content) {
      const { sessionId, turnIndex } = trackContext();
      haptic('error');
      setTranscript('');
      onInputCancel();
      showToast('말이 인식되지 않았어요. 다시 말해볼까요?');
      track(EVENTS.TURN_FAILED, {
        session_id: sessionId ?? undefined,
        turn_index: turnIndex,
        reason: 'empty',
      });
      return;
    }
    onContent(content, 'VOICE', utteranceDurationMs);
  };

  // 인식 오류 — 권한 거부는 설정 유도 안내를, 그 외에는 토스트로 알리고 마이크 대기로 되돌린다
  const recoverFromSttError = (error: Error) => {
    // 좁히기(never) 전에 읽어둔다 — 계측 속성용 에러 이름
    const errorName = error.name;
    if (isMicPermissionDeniedError(error)) {
      setMicPermissionDenied(true);
      if (!micDeniedTrackedRef.current) {
        micDeniedTrackedRef.current = true;
        track(EVENTS.MIC_PERMISSION_DECIDED, {
          granted: false,
          source: 'conversation',
        });
      }
    } else {
      showToast('음성 인식에 문제가 생겼어요. 다시 시도해 주세요');
      track(EVENTS.SPEECH_RECOGNITION_FAILED, { reason: errorName });
      reportWarning(error);
    }
    haptic('error');
    setTranscript('');
    onInputCancel();
  };

  // 마이크 STT 배선 — 침묵 자동 종료는 끄고 완료 버튼(■)만으로 끝낸다 (긴 답변 중 침묵에도 안 끊기게)
  const stt = useStt({
    stopOnSilence: false,
    onInterim: (text) => setTranscript(text),
    onFinal: submitVoice,
    onError: recoverFromSttError,
  });

  // 마이크로 말하기 — 듣기 시작을 알리고 STT를 켠다
  const pressMic = () => {
    if (!canStart) return;
    const { sessionId, turnIndex } = trackContext();
    if (keyboardMode) {
      track(EVENTS.INPUT_MODE_SWITCHED, {
        session_id: sessionId ?? undefined,
        mode: 'voice',
      });
    }
    track(EVENTS.RECORDING_STARTED, {
      session_id: sessionId ?? undefined,
      turn_index: turnIndex,
    });
    setKeyboardMode(false);
    spokeFromRef.current = Date.now();
    onInputStart();
    void stt.start();
  };

  // 키보드로 입력 — 듣기를 시작하되 마이크는 켜지 않고 타이핑 입력창을 연다
  const pressKeyboard = () => {
    if (!canStart) return;
    track(EVENTS.INPUT_MODE_SWITCHED, {
      session_id: trackContext().sessionId ?? undefined,
      mode: 'text',
    });
    setKeyboardMode(true);
    setTranscript('');
    onInputStart();
  };

  const cancelInput = () => {
    const { sessionId, turnIndex } = trackContext();
    if (!keyboardMode) {
      stt.abort();
      track(EVENTS.RECORDING_CANCELED, {
        session_id: sessionId ?? undefined,
        turn_index: turnIndex,
      });
    } else {
      // 타이핑 취소 = 기본 입력 수단(마이크 대기)으로 복귀
      track(EVENTS.INPUT_MODE_SWITCHED, {
        session_id: sessionId ?? undefined,
        mode: 'voice',
      });
    }
    setKeyboardMode(false);
    setTranscript('');
    onInputCancel();
  };

  // 음성 완료(■) — STT를 멈추면 최종 텍스트가 onFinal로 도착해 음성 제출을 잇는다
  const finishListening = () => {
    const { sessionId, turnIndex } = trackContext();
    track(EVENTS.RECORDING_STOPPED, {
      session_id: sessionId ?? undefined,
      turn_index: turnIndex,
    });
    stt.stop();
  };

  // 키보드 전송 — 타이핑한 텍스트를 다듬어 전달한다. 비었으면 조용히 무시(입력창은 열려 있다)
  const submitText = () => {
    const content = transcript.trim();
    if (!content) return;
    // 타이핑은 말한 게 아니라 쓴 것 — 발화 시간을 차감하지 않는다
    onContent(content, 'TEXT', 0);
  };

  // 다음 턴 준비 — 미리보기를 비우고 기본 입력 수단(마이크)부터 다시 시작한다
  const resetForNextTurn = () => {
    setTranscript('');
    setKeyboardMode(false);
  };

  return {
    transcript,
    setTranscript,
    keyboardMode,
    pressMic,
    pressKeyboard,
    cancelInput,
    finishListening,
    submitText,
    resetForNextTurn,
    micPermissionDenied,
    dismissMicPermissionNotice: () => setMicPermissionDenied(false),
  };
};
