'use client';

// 유저 입력 훅 — 마이크 STT(음성)와 키보드 타이핑을 오가며 최종 발화를 다듬어 전달한다 (LAN-141)
// 기본은 마이크(음성, VOICE), 키보드 아이콘을 누르면 타이핑(TEXT)으로 전환한다.
// 음성은 ■ 뒤 바로 보내지 않고 인식된 문장을 확인 단계에 올린다 — 보내기·다시 말하기·고치기 중 하나로 마무리한다.
import { useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { haptic } from '@/shared/haptics';
import { reportWarning } from '@/shared/monitoring/report';
import type { SttResultMeta } from '@/shared/stt/deepgram-stt';
import { isMicPermissionDeniedError, SttError } from '@/shared/stt/errors';
import { useStt, type SttErrorMeta } from '@/shared/stt/useStt';
import { showToast } from '@/shared/ui/toast';

import { removeNonEnglish } from './english-only';

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
  // 확정 전 말이 남아 있는가 — 답변 칸이 듣는 중 표시(점 물결)를 켜고 끄는 기준
  const [speechPending, setSpeechPending] = useState(false);
  // 입력 수단 — 기본은 마이크(음성), 키보드 아이콘을 누르면 타이핑 모드로 바꾼다
  const [keyboardMode, setKeyboardMode] = useState(false);
  // 마이크 권한이 거부돼 STT를 못 켠 상태 — 설정 유도 안내를 띄운다
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  // 권한 거부는 "결정" 이벤트라 대화당 1회만 — 차단 상태에서 반복 탭할 때마다 찍히지 않게
  const micDeniedTrackedRef = useRef(false);
  // 말하기 시작 시각 — 마이크를 켠 순간부터 최종 텍스트가 올 때까지가 발화 시간이다
  const spokeFromRef = useRef<number | null>(null);
  // 확인 단계에 올린 음성 — 처음 인식된 문장과 그때까지 말한 시간. 고쳐서 보내도 말한 답이라 이 시간을 그대로 쓴다
  const [reviewed, setReviewed] = useState<{
    original: string;
    utteranceDurationMs: number;
    reviewedAt: number; // 확인 화면에 올라온 시각 — 머문 시간 계측용
  } | null>(null);
  // 이번 확인에서 고치기 입력창을 한 번이라도 열었는가 — 열었다 닫고 그대로 보낸 경우도 센다
  const editOpenedRef = useRef(false);
  // 마이크를 켠 횟수 — 다시 말하기가 새 발화를 시작했다는 걸 남은 시간 눈금이 알아챈다
  const [listenCount, setListenCount] = useState(0);
  const reviewing = reviewed != null;
  // 다시 말하기 직전의 확인 — 다시 말하다 취소하거나 인식에 실패하면 이 답으로 돌아간다
  const retryFromRef = useRef<typeof reviewed>(null);

  // 이번 발화에 걸린 시간. 시작 표시가 없으면(취소 후 늦게 온 결과) 0으로 둔다
  const takeUtteranceDuration = () => {
    const spokeFrom = spokeFromRef.current;
    spokeFromRef.current = null;
    return spokeFrom == null ? 0 : Date.now() - spokeFrom;
  };

  // 다시 말하기를 되돌린다 — 직전에 인식된 문장으로 확인에 돌아간다. 돌아갈 답이 없으면 false
  const returnToPreviousReview = () => {
    const previous = retryFromRef.current;
    if (!previous) return false;
    retryFromRef.current = null;
    spokeFromRef.current = null;
    setTranscript(previous.original);
    setSpeechPending(false);
    // 머문 시간은 돌아온 때부터 다시 잰다 — 다시 말하던 시간은 확인 화면에 머문 시간이 아니다
    setReviewed({ ...previous, reviewedAt: Date.now() });
    return true;
  };

  // 음성 최종 텍스트 — 비었으면(인식 실패) 마이크 대기로 되돌리고 이유를 알린다. 취소 후엔 오지 않는다(useStt 보장)
  const submitVoice = (raw: string, meta: SttResultMeta) => {
    const content = raw.trim();
    const utteranceDurationMs = takeUtteranceDuration();
    const { sessionId, turnIndex } = trackContext();
    // 빈 결과까지 모두 남긴다 — 문의가 오면 엔진·대기 시간·종료 사유로 대조한다
    track(EVENTS.SPEECH_RECOGNITION_COMPLETED, {
      session_id: sessionId ?? undefined,
      turn_index: turnIndex,
      engine: meta.engine,
      end_reason: meta.endReason,
      connect_ms: meta.connectMs ?? undefined,
      finalize_wait_ms: meta.finalizeWaitMs ?? undefined,
      char_count: content.length,
    });
    if (!content) {
      haptic('error');
      showToast('말이 인식되지 않았어요. 다시 말해볼까요?');
      track(EVENTS.TURN_FAILED, {
        session_id: sessionId ?? undefined,
        turn_index: turnIndex,
        reason: 'empty',
      });
      // 다시 말하던 중이면 이미 있던 답을 버리지 않는다
      if (returnToPreviousReview()) return;
      setTranscript('');
      onInputCancel();
      return;
    }
    retryFromRef.current = null;
    // 보내기 전에 한 번 보여 준다 — 발음 때문에 잘못 알아들은 문장이 그대로 가지 않게
    setTranscript(content);
    setSpeechPending(false);
    editOpenedRef.current = false;
    setReviewed({
      original: content,
      utteranceDurationMs,
      reviewedAt: Date.now(),
    });
  };

  // 인식 오류 — 권한 거부는 설정 유도 안내를, 그 외에는 토스트로 알리고 마이크 대기로 되돌린다
  const recoverFromSttError = (error: Error, meta: SttErrorMeta) => {
    // 좁히기(never) 전에 읽어둔다 — 계측 사유는 SttError면 그 사유(연결 실패·도중 끊김), 그 밖엔 에러 이름
    const failReason = error instanceof SttError ? error.reason : error.name;
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
      track(EVENTS.SPEECH_RECOGNITION_FAILED, {
        engine: meta.engine,
        reason: failReason,
      });
      reportWarning(error);
    }
    haptic('error');
    // 다시 말하던 중이면 이미 있던 답을 버리지 않는다
    if (returnToPreviousReview()) return;
    setTranscript('');
    onInputCancel();
  };

  // 마이크 STT 배선 — 침묵 자동 종료는 끄고 완료 버튼(■)만으로 끝낸다 (긴 답변 중 침묵에도 안 끊기게)
  const stt = useStt({
    stopOnSilence: false,
    onInterim: (text, pending) => {
      setTranscript(text);
      setSpeechPending(pending);
    },
    onFinal: submitVoice,
    onError: recoverFromSttError,
  });

  // 기본 입력 수단(마이크)으로 — 쓰다 만 초안을 버리는 자리는 여기 하나다
  const resetToVoiceInput = () => {
    setKeyboardMode(false);
    setTranscript('');
    setSpeechPending(false);
    setReviewed(null);
    retryFromRef.current = null;
  };

  // 확인 단계의 마무리를 남긴다 — 다시 말하기와 고친 비율로 잘못 알아들은 빈도를, 머문 시간과 나간 비율로 늘어난 단계의 부담을 본다
  const trackReview = (
    action: 'send' | 'retry' | 'leave',
    edited: boolean,
    reviewedAt: number,
  ) => {
    const { sessionId, turnIndex } = trackContext();
    track(EVENTS.TRANSCRIPT_REVIEWED, {
      session_id: sessionId ?? undefined,
      turn_index: turnIndex,
      action,
      edited,
      edit_opened: editOpenedRef.current,
      review_ms: Date.now() - reviewedAt,
    });
  };

  // 마이크를 켜고 말한 시간을 새로 재기 시작한다 — 처음 말하기와 다시 말하기가 같이 쓴다
  const startListening = () => {
    const { sessionId, turnIndex } = trackContext();
    track(EVENTS.RECORDING_STARTED, {
      session_id: sessionId ?? undefined,
      turn_index: turnIndex,
    });
    spokeFromRef.current = Date.now();
    setListenCount((count) => count + 1);
    void stt.start();
  };

  // 마이크로 말하기 — 듣기 시작을 알리고 STT를 켠다
  const pressMic = () => {
    if (!canStart) return;
    if (keyboardMode) {
      track(EVENTS.INPUT_MODE_SWITCHED, {
        session_id: trackContext().sessionId ?? undefined,
        mode: 'voice',
      });
    }
    resetToVoiceInput();
    onInputStart();
    startListening();
  };

  // 확인 단계에서 다시 말하기 — 인식된 문장을 버리고 말하는 중 그대로 마이크를 다시 켠다
  const speakAgain = () => {
    if (!reviewed) return;
    trackReview('retry', false, reviewed.reviewedAt);
    const previous = reviewed;
    resetToVoiceInput();
    retryFromRef.current = previous;
    startListening();
  };

  // 확인 단계에서 고치기 — 인식된 문장이 채워진 입력창을 연다(키보드 입력과 같은 화면)
  const editTranscript = () => {
    if (!reviewing) return;
    editOpenedRef.current = true;
    // 인식기가 드물게 적는 허용 밖 글자는 입력창을 열기 전에 걸러 둔다 — 키보드로 고쳐 쓰는 규칙과 같다
    setTranscript((prev) => removeNonEnglish(prev));
    setKeyboardMode(true);
  };

  // 확인한 답을 보낸다 — 고쳤어도 말한 답이라 VOICE·말한 시간 그대로. 다 지웠으면 보내지 않는다
  const submitReviewed = () => {
    if (!reviewed) return;
    // 고쳐 쓴 입력창이 조합을 끝내기 전에 보낼 수 있다 — 키보드 전송과 같은 거름망을 거친다
    const content = removeNonEnglish(transcript).trim();
    if (!content) return;
    // 처음 문장도 같은 거름망을 거친 값과 견준다 — 손대지 않았는데 걸러졌다고 고친 것으로 세지 않게
    const original = removeNonEnglish(reviewed.original).trim();
    trackReview('send', content !== original, reviewed.reviewedAt);
    onContent(content, 'VOICE', reviewed.utteranceDurationMs);
    // 보냈으면 확인은 끝났다 — 세션을 못 잡아 대기로 돌아오는 길은 다음 턴 준비를 거치지 않아 여기서 닫는다.
    // 보낸 문장은 남겨 둔다(전송 실패 때 다시 보낼 답으로 보인다)
    setReviewed(null);
    setKeyboardMode(false);
    retryFromRef.current = null;
  };

  // 키보드로 입력 — 듣기를 시작하되 마이크는 켜지 않고 타이핑 입력창을 연다
  const pressKeyboard = () => {
    if (!canStart) return;
    // 이미 타이핑 중이었다면(제출이 실패해 돌아왔다) 전환이 아니다
    if (!keyboardMode) {
      track(EVENTS.INPUT_MODE_SWITCHED, {
        session_id: trackContext().sessionId ?? undefined,
        mode: 'text',
      });
    }
    // 말한 내용을 고쳐 쓰는 자리 — 인식기가 적은 허용 밖 글자를 미리 걸러, 첫 입력에 경고가 뜨지 않게 한다
    setTranscript((prev) => removeNonEnglish(prev));
    setKeyboardMode(true);
    onInputStart();
  };

  const cancelInput = () => {
    const { sessionId, turnIndex } = trackContext();
    // 확인 중엔 마이크가 이미 꺼져 있다 — 끌 것도, 전환할 것도 없이 대기로 되돌린다.
    // 확인 중 취소는 대화를 나갈 때뿐이라 나갔다고 남긴다
    if (reviewed) {
      trackReview('leave', false, reviewed.reviewedAt);
      resetToVoiceInput();
      onInputCancel();
      return;
    }
    if (!keyboardMode) {
      stt.abort();
      track(EVENTS.RECORDING_CANCELED, {
        session_id: sessionId ?? undefined,
        turn_index: turnIndex,
      });
      // 다시 말하기만 되돌린다 — 이미 있던 답은 그대로 확인에 남는다
      if (returnToPreviousReview()) return;
    } else {
      // 타이핑 취소 = 기본 입력 수단(마이크 대기)으로 복귀
      track(EVENTS.INPUT_MODE_SWITCHED, {
        session_id: sessionId ?? undefined,
        mode: 'voice',
      });
    }
    resetToVoiceInput();
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
    // 확인 단계에서 연 입력창 — 쓴 게 아니라 말한 답을 고친 것이다
    if (reviewing) {
      submitReviewed();
      return;
    }
    // 입력창이 조합을 끝내기 전에 전송될 수 있어 여기서도 한 번 더 거른다
    const content = removeNonEnglish(transcript).trim();
    if (!content) return;
    // 타이핑은 말한 게 아니라 쓴 것 — 발화 시간을 차감하지 않는다
    onContent(content, 'TEXT', 0);
  };

  // 입력창 닫기(X) — 확인 단계에서 열었으면 고친 내용을 버리고 처음 인식된 문장으로 확인에 돌아간다
  const closeTyping = () => {
    if (!reviewed) {
      cancelInput();
      return;
    }
    setKeyboardMode(false);
    setTranscript(reviewed.original);
  };

  return {
    transcript,
    setTranscript,
    speechPending,
    keyboardMode,
    pressMic,
    pressKeyboard,
    cancelInput,
    finishListening,
    submitText,
    reviewing,
    // 확인 중인 답이 말한 시간 — 남은 시간 눈금이 이 답 하나만 깎은 값으로 맞춘다
    reviewedDurationMs: reviewed?.utteranceDurationMs ?? null,
    listenCount,
    speakAgain,
    editTranscript,
    submitReviewed,
    closeTyping,
    // 다음 턴 준비 — 미리보기를 비우고 기본 입력 수단(마이크)부터 다시 시작한다
    resetForNextTurn: resetToVoiceInput,
    micPermissionDenied,
    dismissMicPermissionNotice: () => setMicPermissionDenied(false),
  };
};
