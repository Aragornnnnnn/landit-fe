'use client';

// 유저 입력 훅 — 마이크 STT(음성)와 키보드 타이핑을 오가며 최종 발화를 다듬어 전달한다 (LAN-141)
// 기본은 마이크(음성, VOICE), 키보드 아이콘을 누르면 타이핑(TEXT)으로 전환한다.
import { useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { haptic } from '@/shared/haptics';
import { isMicPermissionDeniedError } from '@/shared/stt/errors';
import { useStt } from '@/shared/stt/useStt';
import { showToast } from '@/shared/ui/toast';

interface ConversationInputOptions {
  // 대기(USER_READY)에서만 시작 — 빠른 연타·상태 전이 중 중복 탭이 녹음 시작을 이중 집계하지 않게
  canStart: boolean;
  // 계측 속성 전용 — 클로저가 호출 시점의 최신 세션·턴을 읽도록 getter로 받는다
  trackContext: () => { sessionId: number | null; turnIndex: number };
  onListenStart: () => void; // → USER_SPEAKING_STARTED
  onListenCancel: () => void; // → USER_SPEAKING_CANCELLED
  // 다듬어진(공백 아님) 최종 발화 — 음성(STT 최종)이든 타이핑이든 여기로 모인다
  onContent: (content: string, inputType: 'VOICE' | 'TEXT') => void;
}

export const useConversationInput = ({
  canStart,
  trackContext,
  onListenStart,
  onListenCancel,
  onContent,
}: ConversationInputOptions) => {
  const [transcript, setTranscript] = useState('');
  // 입력 수단 — 기본은 마이크(음성), 키보드 아이콘을 누르면 타이핑 모드로 바꾼다
  const [keyboardMode, setKeyboardMode] = useState(false);
  // 마이크 권한이 거부돼 STT를 못 켠 상태 — 설정 유도 안내를 띄운다
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  // 권한 거부는 "결정" 이벤트라 대화당 1회만 — 차단 상태에서 반복 탭할 때마다 찍히지 않게
  const micDeniedTrackedRef = useRef(false);

  // 음성 최종 텍스트 — 비었으면(인식 실패) 마이크 대기로 되돌리고 이유를 알린다
  const submitVoice = (raw: string) => {
    const content = raw.trim();
    if (!content) {
      const { sessionId, turnIndex } = trackContext();
      haptic('error');
      setTranscript('');
      onListenCancel();
      showToast('말이 인식되지 않았어요. 다시 말해볼까요?');
      track(EVENTS.TURN_FAILED, {
        session_id: sessionId ?? undefined,
        turn_index: turnIndex,
        reason: 'empty',
      });
      return;
    }
    onContent(content, 'VOICE');
  };

  // 마이크 STT — 실시간 미리보기는 transcript로, 완료(stop) 시 최종 텍스트로 음성 제출을 잇는다.
  // 침묵 자동 종료는 끄고 완료 버튼(■)만으로 끝낸다 — 긴 답변 중 침묵에도 안 끊긴다.
  // 권한 거부·인식 오류는 조용히 멈추지 말고 마이크 대기로 되돌린다.
  const stt = useStt({
    stopOnSilence: false,
    onInterim: (text) => setTranscript(text),
    onFinal: submitVoice,
    onError: (error) => {
      // 좁히기(never) 전에 읽어둔다 — 계측 속성용 에러 이름
      const errorName = error.name;
      // 권한 거부는 설정 유도 안내를, 그 외 인식 오류는 토스트로 알리고 마이크 대기로 되돌린다.
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
      }
      haptic('error');
      setTranscript('');
      onListenCancel();
    },
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
    onListenStart();
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
    onListenStart();
  };

  const cancelListening = () => {
    const { sessionId, turnIndex } = trackContext();
    if (!keyboardMode) {
      stt.stop();
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
    onListenCancel();
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
    onContent(content, 'TEXT');
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
    cancelListening,
    finishListening,
    submitText,
    resetForNextTurn,
    micPermissionDenied,
    dismissMicPermissionNotice: () => setMicPermissionDenied(false),
  };
};
