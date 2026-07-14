// 대화 플로우 훅 — 상태 기계를 세션 API에 배선한다 (시작·발화 제출·종료)
// STT/TTS 연동 지점: AI 발화 타이머 → useTts onEnd(LAN-140), 유저 입력 → useStt transcript(LAN-141)
'use client';

import { useEffect, useRef, useState } from 'react';

import type { ThoughtType } from '@/features/onboarding/ui/ThoughtCard';
import type { Scenario } from '@/features/scenario/api/list';

import {
  endSession,
  startSession,
  submitMessage,
  type NextMessage,
  type SessionStartResponse,
} from '../api/session';
import {
  initialConversationState,
  nextConversationState,
  type ConversationEvent,
  type ConversationState,
} from './conversationMachine';
import { speechTypingMs, thoughtHoldMs, toThoughtType } from './pacing';

// 화면이 그리는 현재 턴 — 서버 응답에서 조립한다
interface ConversationTurn {
  aiMessage: string; // 크게 보이는 AI 질문(또는 USER 선발화 안내)
  aiTranslation: string | null;
  innerThought: string; // 내 발화 뒤 상대 속마음
  innerThoughtType: ThoughtType;
}

type Status = 'starting' | 'ready' | 'error';

export const useConversationFlow = (scenario: Scenario) => {
  const [session, setSession] = useState<SessionStartResponse | null>(null);
  const [status, setStatus] = useState<Status>('starting');
  const [state, setState] = useState<ConversationState | null>(null);

  // AI 질문과 상대 속마음은 서버 응답이 도착할 때마다 갈아끼운다
  const [aiMessage, setAiMessage] = useState<{
    content: string;
    translatedContent: string | null;
  } | null>(null);
  const [thought, setThought] = useState<{
    text: string;
    type: ThoughtType;
  } | null>(null);
  const [transcript, setTranscript] = useState('');

  // send 클로저가 최신 값을 읽도록 ref로 들고 있는다
  const sessionIdRef = useRef<number | null>(null);
  const hasNextRef = useRef(true);
  const nextMessageRef = useRef<NextMessage | null>(null);
  const startedRef = useRef(false);
  const submittingRef = useRef(false); // 중복 제출 방지 (연출은 WAITING phase가 맡는다)

  const send = (event: ConversationEvent) =>
    setState((prev) =>
      prev ? nextConversationState(prev, event, hasNextRef.current) : prev,
    );

  // 세션 시작 — StrictMode 이중 실행에도 한 번만 만든다
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    startSession(scenario.scenarioId)
      .then((res) => {
        setSession(res);
        sessionIdRef.current = res.sessionId;
        hasNextRef.current = !res.progress.completed;
        if (res.currentMessage) {
          setAiMessage({
            content: res.currentMessage.content,
            translatedContent: res.currentMessage.translatedContent,
          });
        }
        setState(initialConversationState(res.firstSpeaker));
        setStatus('ready');
      })
      .catch((error) => {
        console.error('세션 시작 실패', error);
        setStatus('error');
      });
  }, [scenario.scenarioId]);

  // AI 발화 — 텍스트 길이만큼 말하는 시간을 흉내 내고 끝낸다 (LAN-140에서 TTS onEnd로 교체)
  useEffect(() => {
    if (state?.phase !== 'AI_SPEAKING' || !aiMessage) return;
    const id = setTimeout(
      () => send('AI_SPEECH_END'),
      speechTypingMs(aiMessage.content) + 600,
    );
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.phase, aiMessage?.content]);

  // 속마음 — 잠시 보여준 뒤 다음 질문으로 갈아끼우고 다음 턴으로 넘어간다
  useEffect(() => {
    if (state?.phase !== 'THOUGHT' || !thought) return;
    const id = setTimeout(() => {
      setTranscript('');
      setThought(null);
      if (nextMessageRef.current) {
        setAiMessage({
          content: nextMessageRef.current.content,
          translatedContent: nextMessageRef.current.translatedContent,
        });
        nextMessageRef.current = null;
      }
      send('THOUGHT_DONE');
    }, thoughtHoldMs(thought.text));
    return () => clearTimeout(id);
  }, [state?.phase, thought]);

  const pressMic = () => send('MIC_PRESSED');

  const cancelListening = () => {
    setTranscript('');
    send('LISTENING_CANCELLED');
  };

  // 발화 제출 — 대기(생각 중) 단계로 넘긴 뒤, 응답이 오면 속마음으로 이어간다
  const finishListening = async () => {
    const content = transcript.trim();
    if (!content || submittingRef.current || sessionIdRef.current == null)
      return;

    submittingRef.current = true;
    send('LISTENING_DONE'); // → WAITING (상대가 생각 중)
    try {
      const res = await submitMessage(sessionIdRef.current, content, 'TEXT');
      nextMessageRef.current = res.nextMessage;
      hasNextRef.current = !res.progress.completed && res.nextMessage != null;
      setThought({
        text: res.submittedMessage.innerThought,
        type: toThoughtType(res.submittedMessage.innerThoughtType),
      });
      send('RESPONSE_READY'); // → THOUGHT
    } catch (error) {
      console.error('발화 제출 실패', error);
      send('RESPONSE_FAILED'); // → USER_IDLE (다시 시도)
    } finally {
      submittingRef.current = false;
    }
  };

  // 중도 이탈 시 세션 종료 (정상 완료는 서버가 판정하므로 호출하지 않는다)
  const leave = () => {
    if (sessionIdRef.current != null) {
      endSession(sessionIdRef.current).catch((error) =>
        console.error('세션 종료 실패', error),
      );
    }
  };

  // USER 선발화면 오프닝 안내를, AI 선발화면 현재 질문을 보여준다
  const turn: ConversationTurn = {
    aiMessage: aiMessage?.content ?? session?.userOpeningInstruction ?? '',
    aiTranslation: aiMessage?.translatedContent ?? null,
    innerThought: thought?.text ?? '',
    innerThoughtType: thought?.type ?? 'NORMAL',
  };

  return {
    status,
    phase: state?.phase ?? 'AI_SPEAKING',
    turn,
    transcript,
    setTranscript,
    pressMic,
    cancelListening,
    finishListening,
    leave,
  };
};
