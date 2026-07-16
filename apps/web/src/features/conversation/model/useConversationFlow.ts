// 대화 플로우 훅 — 상태 기계를 세션 API·TTS에 배선한다 (시작·발화 제출·종료·재생)
// 오프닝은 시나리오(리스트 캐시)의 openingPreview로 즉시 시드하고, 세션 시작은 백그라운드로 돌려
// 진입을 막지 않는다. 세션은 발화 제출 때 필요한 sessionId 확보용.
// 유저 입력은 기본 마이크 STT(음성, VOICE), 키보드 아이콘을 누르면 타이핑(TEXT)으로 전환한다(LAN-141)
'use client';

import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useQueryClient } from '@tanstack/react-query';

import type { ThoughtType } from '@/features/conversation/ui/ThoughtReveal';
import { createSessionFeedback } from '@/features/feedback/api/session-feedback';
import { sessionFeedbackKey } from '@/features/feedback/model/useSessionFeedback';
import type { Scenario } from '@/features/scenario/api/list';
import { scenarioKeys } from '@/features/scenario/model/keys';
import { track } from '@/shared/analytics';
import { haptic } from '@/shared/haptics';
import { isMicPermissionDeniedError } from '@/shared/lib/stt/errors';
import { useStt } from '@/shared/lib/stt/useStt';
import { useTts } from '@/shared/lib/tts/useTts';
import { showToast } from '@/shared/ui/toast';

import {
  endSession,
  startSession,
  submitMessage,
  type NextMessage,
} from '../api/session';
import {
  initialConversationState,
  nextConversationState,
  type ConversationEvent,
} from './conversationMachine';
import { speechTypingMs, thoughtHoldMs, toThoughtType } from './pacing';
import { useInnerThought } from './useInnerThought';

// 화면이 그리는 현재 턴 — 오프닝은 openingPreview, 이후는 서버 응답에서 조립한다
interface ConversationTurn {
  aiMessage: string; // 크게 보이는 AI 질문(또는 USER 선발화 안내)
  aiTranslation: string | null;
  innerThought: string; // 내 발화 뒤 상대 속마음
  innerThoughtType: ThoughtType;
  // USER 선발화 안내를 보여주는 중인가 — 카드가 발화가 아닌 '상황 안내' 구조로 그려야 한다
  isUserOpening: boolean;
}

export const useConversationFlow = (scenario: Scenario) => {
  const preview = scenario.openingPreview;
  const voice = preview?.ttsVoice ?? null;

  // 상태·오프닝은 세션을 기다리지 않고 시나리오에서 바로 시드한다
  const [state, setState] = useState(() =>
    initialConversationState(scenario.firstSpeaker),
  );
  const [aiMessage, setAiMessage] = useState<{
    content: string;
    translatedContent: string | null;
  } | null>(() =>
    scenario.firstSpeaker === 'AI' && preview?.aiOpeningMessage
      ? {
          content: preview.aiOpeningMessage,
          translatedContent: preview.aiOpeningMessageTranslation,
        }
      : null,
  );
  const [thought, setThought] = useState<{
    text: string;
    type: ThoughtType;
  } | null>(null);
  const [transcript, setTranscript] = useState('');
  // 입력 수단 — 기본은 마이크(음성), 키보드 아이콘을 누르면 타이핑 모드로 바꾼다
  const [keyboardMode, setKeyboardMode] = useState(false);
  // 마이크 권한이 거부돼 STT를 못 켠 상태 — 설정 유도 안내를 띄운다
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  // 확보된 세션 — 종료 후 피드백 생성에 쓴다. ref는 send 클로저용, state는 화면 노출용
  const [sessionId, setSessionId] = useState<number | null>(null);

  // send 클로저가 최신 값을 읽도록 ref로 들고 있는다
  const sessionIdRef = useRef<number | null>(null);
  const sessionPromiseRef = useRef<Promise<number | null> | null>(null);
  const hasNextRef = useRef(true); // 이어서 재생할 AI 발화가 있는가 (종료 메시지 포함)
  const completedRef = useRef(false); // 그 발화를 끝으로 대화가 종료되는가
  const nextMessageRef = useRef<NextMessage | null>(null);
  const startedRef = useRef(false);
  const submittingRef = useRef(false); // 중복 제출 방지 (연출은 WAITING phase가 맡는다)
  const isOpeningRef = useRef(true); // 첫 AI 발화(오프닝)인지 — 미리 만든 정적 mp3 재생 대상

  const tts = useTts();
  const innerThought = useInnerThought();
  const queryClient = useQueryClient();

  // 대화가 완료되면: 피드백을 미리 생성 요청(prefetch)해 화면 진입 시 즉시 뜨게 하고,
  // 해금된 다음 시나리오(다음 대화)가 홈에 반영되도록 시나리오 캐시를 무효화한다.
  const handleConversationComplete = (finishedSessionId: number) => {
    void queryClient.prefetchQuery({
      queryKey: sessionFeedbackKey(finishedSessionId),
      queryFn: () => createSessionFeedback(finishedSessionId),
      staleTime: Infinity,
    });
    void queryClient.invalidateQueries({ queryKey: scenarioKeys.all });
  };

  const send = (event: ConversationEvent) =>
    setState((prev) =>
      nextConversationState(
        prev,
        event,
        hasNextRef.current,
        completedRef.current,
      ),
    );

  // 마이크 STT — 실시간 미리보기는 transcript로, 완료(stop) 시 최종 텍스트로 음성 제출을 잇는다.
  // 침묵 자동 종료는 끄고 완료 버튼(■)만으로 끝낸다 — 긴 답변 중 침묵에도 안 끊긴다.
  // 권한 거부·인식 오류는 조용히 멈추지 말고 마이크 대기로 되돌린다.
  const stt = useStt({
    stopOnSilence: false,
    onInterim: (text) => setTranscript(text),
    onFinal: (text) => void submitContent(text, 'VOICE'),
    onError: (error) => {
      // 좁히기(never) 전에 읽어둔다 — 계측 속성용 에러 이름
      const errorName = error.name;
      // 권한 거부는 설정 유도 안내를, 그 외 인식 오류는 토스트로 알리고 마이크 대기로 되돌린다.
      if (isMicPermissionDeniedError(error)) {
        setMicPermissionDenied(true);
        track(EVENTS.MIC_PERMISSION_DECIDED, {
          granted: false,
          source: 'conversation',
        });
      } else {
        showToast('음성 인식에 문제가 생겼어요. 다시 시도해 주세요');
        track(EVENTS.SPEECH_RECOGNITION_FAILED, { reason: errorName });
      }
      haptic('error');
      setTranscript('');
      send('LISTENING_CANCELLED');
    },
  });

  const dismissMicPermissionNotice = () => setMicPermissionDenied(false);

  // 세션은 백그라운드로 시작 — 화면은 이미 openingPreview로 떴고, 제출 때 쓸 sessionId만 확보한다.
  // StrictMode 이중 실행에도 한 번만 만든다.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    sessionPromiseRef.current = startSession(scenario.scenarioId)
      .then((res) => {
        sessionIdRef.current = res.sessionId;
        setSessionId(res.sessionId);
        hasNextRef.current = !res.progress.completed;
        track(EVENTS.CONVERSATION_STARTED, {
          scenario_id: scenario.scenarioId,
          session_id: res.sessionId,
          first_speaker: scenario.firstSpeaker,
          is_retry: scenario.completed,
        });
        // openingPreview로 오프닝을 못 시드했을 때(예외적)만 세션 응답으로 채운다
        if (res.currentMessage) {
          const message = res.currentMessage;
          setAiMessage(
            (prev) =>
              prev ?? {
                content: message.content,
                translatedContent: message.translatedContent,
              },
          );
        }
        return res.sessionId;
      })
      .catch((error) => {
        console.error('세션 시작 실패', error);
        return null;
      });
  }, [scenario.scenarioId]);

  // AI 발화 — TTS로 실제 재생하고, 재생이 끝나면 마이크 대기로 넘어간다.
  // 오프닝은 미리 만든 정적 mp3, 없으면 런타임 합성/타이머로 폴백해 대화가 멈추지 않게 한다.
  useEffect(() => {
    if (state.phase !== 'AI_SPEAKING' || !aiMessage) return;

    const content = aiMessage.content;
    const advance = () => send('AI_SPEECH_END');
    const speakOrTimer = () => {
      if (voice) {
        void tts.speak(content, voice, { onEnd: advance, onError: advance });
      } else {
        const id = setTimeout(advance, speechTypingMs(content) + 600);
        return () => clearTimeout(id);
      }
    };

    if (isOpeningRef.current) {
      tts.speakSrc(`/audio/opening-${scenario.scenarioId}.mp3`, {
        onEnd: advance,
        onError: speakOrTimer,
      });
      return () => tts.stop();
    }

    const cleanupTimer = speakOrTimer();
    return cleanupTimer ?? (() => tts.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, aiMessage?.content]);

  // 다음 질문을 화면에 올리고 턴을 넘긴다 — 속마음 노출을 마쳤을 때와 건너뛸 때가 공유한다
  const advanceToNextTurn = (event: 'THOUGHT_DONE' | 'RESPONSE_SKIPPED') => {
    setTranscript('');
    setKeyboardMode(false); // 다음 턴은 마이크(음성)부터 다시 시작
    setThought(null);
    if (nextMessageRef.current) {
      setAiMessage({
        content: nextMessageRef.current.content,
        translatedContent: nextMessageRef.current.translatedContent,
      });
      nextMessageRef.current = null;
      isOpeningRef.current = false; // 이후 발화는 동적 생성 — 정적 mp3 대상 아님
    }
    send(event);
  };

  // 속마음 — 잠시 보여준 뒤 다음 질문으로 갈아끼우고 다음 턴으로 넘어간다
  useEffect(() => {
    if (state.phase !== 'THOUGHT' || !thought) return;
    const id = setTimeout(
      () => advanceToNextTurn('THOUGHT_DONE'),
      thoughtHoldMs(thought.text),
    );
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, thought]);

  // 마이크로 말하기 — 듣기 상태로 넘기고 STT를 켠다
  const pressMic = () => {
    if (keyboardMode) {
      track(EVENTS.INPUT_MODE_SWITCHED, {
        session_id: sessionIdRef.current ?? undefined,
        mode: 'voice',
      });
    }
    track(EVENTS.RECORDING_STARTED, {
      session_id: sessionIdRef.current ?? undefined,
      turn_index: state.turnIndex,
    });
    setKeyboardMode(false);
    send('MIC_PRESSED');
    void stt.start();
  };

  // 키보드로 입력 — 듣기 상태로 넘기되 마이크는 켜지 않고 타이핑 입력창을 연다
  const pressKeyboard = () => {
    track(EVENTS.INPUT_MODE_SWITCHED, {
      session_id: sessionIdRef.current ?? undefined,
      mode: 'text',
    });
    setKeyboardMode(true);
    setTranscript('');
    send('MIC_PRESSED');
  };

  const cancelListening = () => {
    if (!keyboardMode) {
      stt.stop();
      track(EVENTS.RECORDING_CANCELED, {
        session_id: sessionIdRef.current ?? undefined,
        turn_index: state.turnIndex,
      });
    }
    setKeyboardMode(false);
    setTranscript('');
    send('LISTENING_CANCELLED');
  };

  // 음성 완료(■) — STT를 멈추면 최종 텍스트가 onFinal로 도착해 음성 제출을 잇는다
  const finishListening = () => {
    stt.stop();
  };

  // 키보드 전송 — 타이핑한 텍스트를 바로 제출한다
  const submitText = async () => {
    await submitContent(transcript, 'TEXT');
  };

  // 발화 제출 — 대기(생각 중)로 넘긴 뒤, 응답이 오면 속마음으로 이어간다.
  // 세션이 백그라운드로 아직 안 끝났으면 sessionId 확보를 기다린다.
  const submitContent = async (raw: string, inputType: 'VOICE' | 'TEXT') => {
    const content = raw.trim();
    if (submittingRef.current) return;
    if (!content) {
      // 음성이 하나도 인식되지 않은 채 완료(■) — 조용히 무시하면 듣는 중 UI에 갇힌다.
      // 마이크 대기로 되돌리고 왜 넘어가지 않는지 알려준다.
      if (inputType === 'VOICE') {
        haptic('error');
        setTranscript('');
        send('LISTENING_CANCELLED');
        showToast('말이 인식되지 않았어요. 다시 말해볼까요?');
        track(EVENTS.TURN_FAILED, {
          session_id: sessionIdRef.current ?? undefined,
          turn_index: state.turnIndex,
          reason: 'empty',
        });
      }
      return;
    }

    submittingRef.current = true;
    send('LISTENING_DONE'); // → WAITING (상대가 생각 중)
    try {
      const sessionId =
        sessionIdRef.current ?? (await sessionPromiseRef.current);
      if (sessionId == null) {
        console.error('세션이 없어 제출할 수 없어요');
        haptic('error');
        send('RESPONSE_FAILED');
        showToast('연결에 문제가 생겼어요. 잠시 후 다시 시도해 주세요');
        track(EVENTS.TURN_FAILED, {
          turn_index: state.turnIndex,
          reason: 'api_error',
        });
        return;
      }

      const res = await submitMessage(sessionId, content, inputType);
      track(EVENTS.TURN_COMPLETED, {
        session_id: sessionId,
        scenario_id: scenario.scenarioId,
        turn_index: state.turnIndex,
        input_type: inputType === 'VOICE' ? 'voice' : 'text',
        char_count: content.length,
      });
      nextMessageRef.current = res.nextMessage;
      // 종료 메시지도 nextMessage로 오므로, 발화 유무는 nextMessage로 판단하고
      // 그 발화를 끝으로 종료인지는 completed로 따로 들고 간다 (완료 발화도 재생 후 CTA로)
      hasNextRef.current = res.nextMessage != null;
      completedRef.current = res.progress.completed;
      // 마지막 발화였다면 피드백을 미리 만들고 다음 대화 해금을 홈에 반영한다
      if (res.progress.completed) {
        track(EVENTS.CONVERSATION_COMPLETED, {
          session_id: sessionId,
          scenario_id: scenario.scenarioId,
          turn_count: res.progress.totalQuestionCount,
        });
        handleConversationComplete(sessionId);
      }
      // 다음 질문이 오면 속마음을 기다리지 않고 바로 미리 합성한다 — 다음 발화 재생 지연을 없앤다
      if (res.nextMessage && voice) {
        void tts.prefetch(res.nextMessage.content, voice);
      }
      // 속마음은 준비됐으면 즉시, 아직이면 폴링으로 완료된 뒤 노출한다.
      // 그 사이 WAITING(생각 중) 연출이 화면을 가리고, 다음 질문 합성은 이미 시작됐다.
      void innerThought
        .resolve(sessionId, res.submittedMessage)
        .then((resolved) => {
          if (!resolved) return; // 이탈 중이면 화면을 건드리지 않는다
          // 속마음이 비면(생성 실패·타임아웃) 빈 말풍선 대신 건너뛰고 바로 다음 턴으로 넘긴다
          if (!resolved.text) {
            advanceToNextTurn('RESPONSE_SKIPPED');
            return;
          }
          setThought({
            text: resolved.text,
            type: toThoughtType(resolved.type),
          });
          track(EVENTS.INNER_THOUGHT_VIEWED, {
            session_id: sessionId,
            turn_index: state.turnIndex,
            thought_type: resolved.type ?? undefined,
          });
          haptic('light'); // 상대가 응답을 시작하는 순간 가벼운 틱
          send('RESPONSE_READY'); // → THOUGHT
        });
    } catch (error) {
      console.error('발화 제출 실패', error);
      haptic('error');
      send('RESPONSE_FAILED'); // → USER_IDLE (다시 시도)
      showToast('전송에 실패했어요. 다시 시도해 주세요');
      track(EVENTS.TURN_FAILED, {
        session_id: sessionIdRef.current ?? undefined,
        turn_index: state.turnIndex,
        reason: 'api_error',
      });
    } finally {
      submittingRef.current = false;
    }
  };

  // 중도 이탈 시 세션 종료 (정상 완료는 서버가 판정하므로 호출하지 않는다)
  const leave = () => {
    track(EVENTS.CONVERSATION_ABANDONED, {
      session_id: sessionIdRef.current ?? undefined,
      scenario_id: scenario.scenarioId,
      turn_index: state.turnIndex,
    });
    innerThought.cancel(); // 진행 중인 속마음 폴링을 멈춘다
    if (sessionIdRef.current != null) {
      endSession(sessionIdRef.current).catch((error) =>
        console.error('세션 종료 실패', error),
      );
    }
  };

  // USER 선발화면 오프닝 안내를, AI 선발화면 현재 질문을 보여준다
  const turn: ConversationTurn = {
    aiMessage: aiMessage?.content ?? preview?.userOpeningInstruction ?? '',
    aiTranslation: aiMessage?.translatedContent ?? null,
    innerThought: thought?.text ?? '',
    innerThoughtType: thought?.type ?? 'NORMAL',
    // 첫 AI 발화가 오기 전까지가 선발화 안내 구간
    isUserOpening: !aiMessage && Boolean(preview?.userOpeningInstruction),
  };

  // 상대 캐릭터 성별은 시나리오 TTS 음성을 따른다 (미설정 시 남성)
  const partner: 'male' | 'female' =
    voice?.gender === 'FEMALE' ? 'female' : 'male';

  return {
    phase: state.phase,
    turn,
    partner,
    transcript,
    setTranscript,
    keyboardMode,
    pressMic,
    pressKeyboard,
    cancelListening,
    finishListening,
    submitText,
    leave,
    micPermissionDenied,
    dismissMicPermissionNotice,
    // DONE 시점엔 세션이 확보돼 있다 — 피드백 생성에 쓴다 (없으면 세션 시작이 실패한 경우)
    sessionId,
  };
};
