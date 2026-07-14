// 대화 플로우 훅 — 상태 기계를 세션 API·TTS에 배선한다 (시작·발화 제출·종료·재생)
// 오프닝은 시나리오(리스트 캐시)의 openingPreview로 즉시 시드하고, 세션 시작은 백그라운드로 돌려
// 진입을 막지 않는다. 세션은 발화 제출 때 필요한 sessionId 확보용.
// 남은 연동 지점: 유저 입력 → useStt transcript(LAN-141), 지금은 dev 타이핑 stub
'use client';

import { useEffect, useRef, useState } from 'react';

import type { ThoughtType } from '@/features/onboarding/ui/ThoughtCard';
import type { Scenario } from '@/features/scenario/api/list';
import { useTts } from '@/shared/lib/tts/useTts';

import {
  endSession,
  getInnerThought,
  startSession,
  submitMessage,
  type NextMessage,
  type SubmittedMessage,
} from '../api/session';
import {
  initialConversationState,
  nextConversationState,
  type ConversationEvent,
} from './conversationMachine';
import {
  innerThoughtMaxPolls,
  innerThoughtPollMs,
  speechTypingMs,
  thoughtHoldMs,
  toThoughtType,
} from './pacing';

// 폴링 간격만큼 기다린다 — 백그라운드 속마음 폴링에서 쓴다
const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// 화면이 그리는 현재 턴 — 오프닝은 openingPreview, 이후는 서버 응답에서 조립한다
interface ConversationTurn {
  aiMessage: string; // 크게 보이는 AI 질문(또는 USER 선발화 안내)
  aiTranslation: string | null;
  innerThought: string; // 내 발화 뒤 상대 속마음
  innerThoughtType: ThoughtType;
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

  // send 클로저가 최신 값을 읽도록 ref로 들고 있는다
  const sessionIdRef = useRef<number | null>(null);
  const sessionPromiseRef = useRef<Promise<number | null> | null>(null);
  const hasNextRef = useRef(true);
  const nextMessageRef = useRef<NextMessage | null>(null);
  const startedRef = useRef(false);
  const submittingRef = useRef(false); // 중복 제출 방지 (연출은 WAITING phase가 맡는다)
  const isOpeningRef = useRef(true); // 첫 AI 발화(오프닝)인지 — 미리 만든 정적 mp3 재생 대상
  const leftRef = useRef(false); // 이탈/언마운트 — 백그라운드 폴링이 죽은 화면에 반영하지 않게 한다

  const tts = useTts();

  // 이탈·언마운트 후 도착한 폴링 결과가 상태를 건드리지 않게 막는다
  useEffect(
    () => () => {
      leftRef.current = true;
    },
    [],
  );

  const send = (event: ConversationEvent) =>
    setState((prev) => nextConversationState(prev, event, hasNextRef.current));

  // 세션은 백그라운드로 시작 — 화면은 이미 openingPreview로 떴고, 제출 때 쓸 sessionId만 확보한다.
  // StrictMode 이중 실행에도 한 번만 만든다.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    sessionPromiseRef.current = startSession(scenario.scenarioId)
      .then((res) => {
        sessionIdRef.current = res.sessionId;
        hasNextRef.current = !res.progress.completed;
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

  // 속마음 — 잠시 보여준 뒤 다음 질문으로 갈아끼우고 다음 턴으로 넘어간다
  useEffect(() => {
    if (state.phase !== 'THOUGHT' || !thought) return;
    const id = setTimeout(() => {
      setTranscript('');
      setThought(null);
      if (nextMessageRef.current) {
        setAiMessage({
          content: nextMessageRef.current.content,
          translatedContent: nextMessageRef.current.translatedContent,
        });
        nextMessageRef.current = null;
        isOpeningRef.current = false; // 이후 발화는 동적 생성 — 정적 mp3 대상 아님
      }
      send('THOUGHT_DONE');
    }, thoughtHoldMs(thought.text));
    return () => clearTimeout(id);
  }, [state.phase, thought]);

  const pressMic = () => send('MIC_PRESSED');

  const cancelListening = () => {
    setTranscript('');
    send('LISTENING_CANCELLED');
  };

  // 속마음을 노출하고 THOUGHT로 넘긴다 (즉시 준비된 경우와 폴링 완료가 공유한다)
  const revealThought = (text: string, type: string | null) => {
    setThought({ text, type: toThoughtType(type) });
    send('RESPONSE_READY'); // → THOUGHT
  };

  // 속마음이 아직 생성 중(PREPARING)이면 0.5s 간격으로 폴링하다 완료되면 노출한다.
  // 그동안 WAITING(생각 중) 연출이 화면을 가리고, 다음 질문 합성은 이미 시작된 상태다.
  const pollThenReveal = async (
    sessionId: number,
    submitted: SubmittedMessage,
  ) => {
    for (let i = 0; i < innerThoughtMaxPolls; i++) {
      await delay(innerThoughtPollMs);
      if (leftRef.current) return;
      try {
        const res = await getInnerThought(sessionId, submitted.messageId);
        if (res.processingStatus === 'COMPLETED') {
          if (leftRef.current) return;
          revealThought(res.innerThought ?? '', res.innerThoughtType);
          return;
        }
        if (res.processingStatus === 'FAILED') break;
      } catch {
        // 일시적 오류는 다음 폴에서 다시 시도한다
      }
    }
    if (leftRef.current) return;
    // 실패/시간초과 — 제출 응답에 담긴 값(있으면)으로라도 진행해 대화가 멈추지 않게 한다
    revealThought(submitted.innerThought, submitted.innerThoughtType);
  };

  // 발화 제출 — 대기(생각 중)로 넘긴 뒤, 응답이 오면 속마음으로 이어간다.
  // 세션이 백그라운드로 아직 안 끝났으면 sessionId 확보를 기다린다.
  const finishListening = async () => {
    const content = transcript.trim();
    // TODO(전역 토스트): 음성이 하나도 인식되지 않은 채 완료하면 조용히 무시하지 말고 "말이 인식되지 않았어요" 토스트 노출
    if (!content || submittingRef.current) return;

    submittingRef.current = true;
    send('LISTENING_DONE'); // → WAITING (상대가 생각 중)
    try {
      const sessionId =
        sessionIdRef.current ?? (await sessionPromiseRef.current);
      if (sessionId == null) {
        // TODO(전역 토스트): 세션 시작 실패 — "잠시 후 다시 시도해 주세요" 노출
        console.error('세션이 없어 제출할 수 없어요');
        send('RESPONSE_FAILED');
        return;
      }

      const res = await submitMessage(sessionId, content, 'TEXT');
      nextMessageRef.current = res.nextMessage;
      hasNextRef.current = !res.progress.completed && res.nextMessage != null;
      // 다음 질문이 오면 속마음을 기다리지 않고 바로 미리 합성한다 — 다음 발화 재생 지연을 없앤다
      if (res.nextMessage && voice) {
        void tts.prefetch(res.nextMessage.content, voice);
      }
      // 속마음이 이미 준비됐으면 바로 노출하고, 아직 생성 중이면 백그라운드로 폴링해 완료되면 노출한다
      if (res.submittedMessage.innerThoughtProcessingStatus === 'COMPLETED') {
        revealThought(
          res.submittedMessage.innerThought,
          res.submittedMessage.innerThoughtType,
        );
      } else {
        void pollThenReveal(sessionId, res.submittedMessage);
      }
    } catch (error) {
      // TODO(전역 토스트): 콘솔 대신 "전송에 실패했어요. 다시 시도해 주세요" 토스트로 실패를 알린다
      console.error('발화 제출 실패', error);
      send('RESPONSE_FAILED'); // → USER_IDLE (다시 시도)
    } finally {
      submittingRef.current = false;
    }
  };

  // 중도 이탈 시 세션 종료 (정상 완료는 서버가 판정하므로 호출하지 않는다)
  const leave = () => {
    leftRef.current = true; // 진행 중인 속마음 폴링을 멈춘다
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
    pressMic,
    cancelListening,
    finishListening,
    leave,
  };
};
