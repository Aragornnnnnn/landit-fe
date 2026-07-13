// 대화 플로우 훅 — 상태 기계에 [시뮬] 타이머(발화 시간·답변 채움·속마음 유지)를 배선한다
// STT/TTS 연동 시 교체 지점: AI 발화 타이머 → useTts onEnd, 답변 interval → useStt transcript
'use client';

import { useEffect, useState } from 'react';

import type { Scenario } from '@/features/scenario/api/list';

import {
  initialConversationState,
  nextConversationState,
  type ConversationEvent,
} from './conversationMachine';
import {
  buildSimTurns,
  speechTypingMs,
  thoughtHoldMs,
  WORD_FILL_MS,
} from './sim-fixture';

export const useConversationFlow = (scenario: Scenario) => {
  // 대본은 마운트 시 1회 고정 — 리렌더마다 다시 만들면 타이머 effect가 계속 재시작된다
  const [turns] = useState(() => buildSimTurns(scenario));
  const [state, setState] = useState(() =>
    initialConversationState(scenario.firstSpeaker),
  );
  const [transcript, setTranscript] = useState('');

  const send = (event: ConversationEvent) =>
    setState((prev) => nextConversationState(prev, event, turns.length));

  const turn = turns[state.turnIndex];

  // AI 발화 — 텍스트 길이만큼 말하는 시간을 흉내 내고 끝낸다
  useEffect(() => {
    if (state.phase !== 'AI_SPEAKING') return;
    const id = setTimeout(
      () => send('AI_SPEECH_END'),
      speechTypingMs(turns[state.turnIndex].aiMessage) + 600,
    );
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.turnIndex]);

  // 듣는 중 — 샘플 답변을 한 단어씩 좌→우로 채운다
  useEffect(() => {
    if (state.phase !== 'USER_LISTENING') return;
    const words = turns[state.turnIndex].userAnswer.split(' ');
    let count = 0;
    const id = setInterval(() => {
      count += 1;
      setTranscript(words.slice(0, count).join(' '));
      if (count >= words.length) clearInterval(id);
    }, WORD_FILL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.turnIndex]);

  // 속마음 — 잠시 보여주고 지난 답변을 지운 뒤 자동으로 다음 턴으로 넘어간다
  useEffect(() => {
    if (state.phase !== 'THOUGHT') return;
    const id = setTimeout(() => {
      setTranscript('');
      send('THOUGHT_DONE');
    }, thoughtHoldMs(turns[state.turnIndex].innerThought));
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.turnIndex]);

  const pressMic = () => send('MIC_PRESSED');
  const cancelListening = () => {
    setTranscript('');
    send('LISTENING_CANCELLED');
  };
  const finishListening = () => send('LISTENING_DONE');

  return {
    phase: state.phase,
    turn,
    transcript,
    pressMic,
    cancelListening,
    finishListening,
  };
};
