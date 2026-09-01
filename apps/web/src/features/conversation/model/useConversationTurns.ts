// 대화 턴 엔진 훅 — 상태 기계를 입력(STT/키보드)·발화 재생·속마음 폴링에 배선해 턴 루프를 굴린다.
// 어느 대화 유형인지는 모른다 — 세션 확보(ensureSession)·발화 제출과 완료 판정(submit)은 주입받고,
// 완료 후 무엇이 일어나는지는 호출자 소관이다.
'use client';

import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { haptic } from '@/shared/haptics';
import { reportError } from '@/shared/monitoring/report';
import type { TtsVoice } from '@/shared/tts/voice';
import { showToast } from '@/shared/ui/toast';

import type { NextMessage, SubmittedMessage } from '../api/session';
import {
  initialConversationState,
  nextConversationState,
  type ConversationEvent,
} from './conversation-machine';
import { expressionHoldMs, thoughtHoldMs, toThoughtType } from './pacing';
import type { FloatingThought, ThoughtType } from './thought';
import { useAiSpeech, type SpeechSource } from './useAiSpeech';
import { useConversationInput } from './useConversationInput';
import { useInnerThought } from './useInnerThought';

// 화면이 그리는 현재 턴 — 오프닝은 opening 시드, 이후는 제출 결과에서 조립한다
export interface ConversationTurn {
  aiMessage: string; // 크게 보이는 AI 질문(또는 USER 선발화 안내)
  aiTranslation: string | null;
  innerThought: string; // 내 발화 뒤 상대 속마음
  innerThoughtType: ThoughtType;
  // USER 선발화 안내를 보여주는 중인가 — 카드가 발화가 아닌 '상황 안내' 구조로 그려야 한다
  isUserOpening: boolean;
}

// 제출 결과의 다음 발화 — 분리 재생 소스(맞장구·고정 질문 음원)가 실려 오면 재생 훅에 그대로 전달된다
export interface TurnNextMessage extends NextMessage, SpeechSource {}

// 제출 결과 계약 — 호출자가 자기 API 응답을 이 모양으로 판정해 돌려준다
export interface TurnSubmitResult {
  submittedMessage: SubmittedMessage;
  nextMessage: TurnNextMessage | null;
  // 이 발화를 끝으로 대화가 종료되는가 — 판정 기준(진행도·턴 상태)은 호출자가 안다
  completed: boolean;
}

interface ConversationTurnsOptions {
  firstSpeaker: 'AI' | 'USER';
  voice: TtsVoice | null;
  // 진입 시 보여줄 첫 AI 발화 — 뒤늦게 도착(세션 응답 폴백)해도 대화가 진행되기 전이면 반영된다
  opening: { content: string; translatedContent: string | null } | null;
  // USER 선발화 안내 문구 — 첫 AI 발화가 오기 전까지 카드가 안내 구조로 그려진다
  openingInstruction: string | null;
  // 미리 녹음된 오프닝 오디오 경로 — 없으면(null) 오프닝도 합성으로 말한다
  openingAudioSrc: string | null;
  // 화면·계측용 세션 id (백그라운드 확보 전엔 null)
  sessionId: number | null;
  // 제출 직전 세션 확보 — 실패하면 null을 주고, 턴은 재시도 대기로 되돌아간다
  ensureSession: () => Promise<number | null>;
  submit: (args: {
    sessionId: number;
    content: string;
    inputType: 'VOICE' | 'TEXT';
    turnIndex: number;
    // 이번 턴에 실제로 말한 시간 — 발화 예산을 쓰는 대화(스몰톡)가 이 값으로 차감한다
    utteranceDurationMs: number;
    // null이면 호출자가 이 턴을 스스로 정리한 것 — 엔진은 화면을 건드리지 않고 손을 뗀다
  }) => Promise<TurnSubmitResult | null>;
}

export const useConversationTurns = ({
  firstSpeaker,
  voice,
  opening,
  openingInstruction,
  openingAudioSrc,
  sessionId,
  ensureSession,
  submit,
}: ConversationTurnsOptions) => {
  const [state, setState] = useState(() =>
    initialConversationState(firstSpeaker),
  );
  // 제출 결과로 갈아끼운 발화만 상태로 — 오프닝은 아래 currentMessage에서 렌더 폴백으로 얹는다
  const [aiMessage, setAiMessage] = useState<TurnNextMessage | null>(null);
  // 대화가 진행되기 전까지는 오프닝이 현재 발화다 — 뒤늦게 도착(세션 응답 폴백)해도 그대로 반영된다
  const currentMessage = aiMessage ?? opening;
  const [thought, setThought] = useState<FloatingThought | null>(null);
  // 노출을 끝낸 속마음 — 화면이 표정으로 반응할 수 있게 그 사실만 남긴다.
  // 매번 새 객체라 같은 종류가 연달아 와도 서로 다른 반응으로 구분된다
  const [finishedThought, setFinishedThought] =
    useState<FloatingThought | null>(null);

  // send 클로저가 최신 값을 읽도록 ref로 들고 있는다
  const completedRef = useRef(false); // 그 발화를 끝으로 대화가 종료되는가
  const nextMessageRef = useRef<TurnNextMessage | null>(null);
  const submittingRef = useRef(false); // 중복 제출 방지 (연출은 AI_THINKING phase가 맡는다)

  const innerThought = useInnerThought();

  const send = (event: ConversationEvent) =>
    setState((prev) =>
      nextConversationState(prev, event, completedRef.current),
    );

  // AI 발화 재생 — 끝나면 상태기계에 알린다 (오프닝 오디오·TTS 합성·타이머 폴백은 훅 안에)
  const aiSpeech = useAiSpeech({
    playing: state.phase === 'AI_SPEAKING' && currentMessage != null,
    // 오프닝은 content만 있는 소스라 자연히 전체 합성 경로를 탄다
    source: currentMessage,
    voice,
    openingSrc: openingAudioSrc,
    onSpeechEnd: () => send('AI_SPEAKING_DONE'),
  });

  // 유저 입력 — 마이크/키보드 전환과 STT 배선은 훅 안에, 여기서는 상태 전이와 제출만 잇는다
  const input = useConversationInput({
    canStart: state.phase === 'USER_READY',
    trackContext: () => ({
      sessionId,
      turnIndex: state.turnIndex,
    }),
    onInputStart: () => send('USER_SPEAKING_STARTED'),
    onInputCancel: () => send('USER_SPEAKING_CANCELLED'),
    onContent: (content, inputType, utteranceDurationMs) =>
      void submitContent(content, inputType, utteranceDurationMs),
  });

  // 다음 질문을 화면에 올리고 턴을 넘긴다 — 속마음 노출을 마쳤을 때와 건너뛸 때가 공유한다
  const startNextTurn = (
    event: 'INNER_THOUGHT_DONE' | 'AI_RESPONSE_SKIPPED',
  ) => {
    input.resetForNextTurn();
    if (event === 'INNER_THOUGHT_DONE' && thought) setFinishedThought(thought);
    setThought(null);
    if (nextMessageRef.current) {
      setAiMessage(nextMessageRef.current);
      nextMessageRef.current = null;
      aiSpeech.markOpeningPlayed();
    }
    send(event);
  };

  // 표정 여운 — 노출을 끝낸 속마음을 잠깐 들고 있다가 지운다. 화면은 이걸 보고 표정을 짓는다
  useEffect(() => {
    if (!finishedThought) return;
    const id = setTimeout(() => setFinishedThought(null), expressionHoldMs);
    return () => clearTimeout(id);
  }, [finishedThought]);

  // 속마음 — 잠시 보여준 뒤 다음 질문으로 갈아끼우고 다음 턴으로 넘어간다
  useEffect(() => {
    if (state.phase !== 'AI_INNER_THOUGHT' || !thought) return;
    const id = setTimeout(
      () => startNextTurn('INNER_THOUGHT_DONE'),
      thoughtHoldMs(thought.text),
    );
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, thought]);

  // 발화 제출 — 대기(생각 중)로 넘긴 뒤, 응답이 오면 속마음으로 이어간다.
  // 세션이 백그라운드로 아직 안 끝났으면 sessionId 확보를 기다린다.
  const submitContent = async (
    content: string,
    inputType: 'VOICE' | 'TEXT',
    utteranceDurationMs: number,
  ) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    send('USER_SPEAKING_DONE'); // → AI_THINKING (상대가 생각 중)
    try {
      // 반환하는 sessionId 옵션과 다른 값 — 백그라운드 시작이 아직이면 확보를 기다린 결과
      const activeSessionId = await ensureSession();
      if (activeSessionId == null) {
        console.warn('[conversation] 세션이 없어 제출할 수 없어요');
        haptic('error');
        send('AI_RESPONSE_FAILED');
        showToast('연결에 문제가 생겼어요. 잠시 후 다시 시도해 주세요');
        track(EVENTS.TURN_FAILED, {
          turn_index: state.turnIndex,
          reason: 'api_error',
        });
        return;
      }

      const res = await submit({
        sessionId: activeSessionId,
        content,
        inputType,
        turnIndex: state.turnIndex,
        utteranceDurationMs,
      });
      // 호출자가 이 턴을 스스로 접었다(예: 대화를 나가는 중) — 다음 연출을 이어붙이지 않는다
      if (!res) return;
      // 종료 인사도 nextMessage로 오고, 그 인사를 끝으로 종료인지는 completed가 알려준다 (인사 재생 후 CTA)
      nextMessageRef.current = res.nextMessage;
      completedRef.current = res.completed;
      // 다음 질문이 오면 속마음을 기다리지 않고 바로 미리 준비한다 — 합성분은 미리 합성하고,
      // 질문 음원은 미리 열어 다음 발화 재생 지연을 없앤다
      if (res.nextMessage) aiSpeech.prefetch(res.nextMessage);
      // 속마음은 준비됐으면 즉시, 아직이면 폴링으로 완료된 뒤 노출한다.
      // 그 사이 AI_THINKING(생각 중) 연출이 화면을 가리고, 다음 질문 합성은 이미 시작됐다.
      void innerThought
        .resolve(activeSessionId, res.submittedMessage)
        .then((resolved) => {
          if (!resolved) return; // 이탈 중이면 화면을 건드리지 않는다
          // 속마음이 비면(생성 실패·타임아웃) 빈 말풍선 대신 건너뛰고 바로 다음 턴으로 넘긴다
          if (!resolved.text) {
            startNextTurn('AI_RESPONSE_SKIPPED');
            return;
          }
          setThought({
            text: resolved.text,
            type: toThoughtType(resolved.type),
          });
          track(EVENTS.INNER_THOUGHT_VIEWED, {
            session_id: activeSessionId,
            turn_index: state.turnIndex,
            thought_type: resolved.type ?? undefined,
          });
          haptic('light'); // 상대가 응답을 시작하는 순간 가벼운 틱
          send('AI_RESPONSE_READY'); // → AI_INNER_THOUGHT
        });
    } catch (error) {
      console.warn('[conversation] 발화 제출 실패', error);
      reportError(error);
      haptic('error');
      send('AI_RESPONSE_FAILED'); // → USER_READY (다시 시도)
      showToast('전송에 실패했어요. 다시 시도해 주세요');
      track(EVENTS.TURN_FAILED, {
        session_id: sessionId ?? undefined,
        turn_index: state.turnIndex,
        reason: 'api_error',
      });
    } finally {
      submittingRef.current = false;
    }
  };

  // 중도 이탈 — 진행 중인 속마음 폴링을 멈춘다 (세션 정리는 세션을 소유한 호출자 몫)
  const abandon = () => {
    innerThought.cancel();
  };

  // USER 선발화면 오프닝 안내를, AI 선발화면 현재 질문을 보여준다
  const turn: ConversationTurn = {
    aiMessage: currentMessage?.content ?? openingInstruction ?? '',
    aiTranslation: currentMessage?.translatedContent ?? null,
    innerThought: thought?.text ?? '',
    innerThoughtType: thought?.type ?? 'NORMAL',
    // 첫 AI 발화가 오기 전까지가 선발화 안내 구간
    isUserOpening: !currentMessage && Boolean(openingInstruction),
  };

  return {
    phase: state.phase,
    turnIndex: state.turnIndex,
    turn,
    finishedThought,
    // 지금 소리 나는 발화 — 캐릭터가 입모양을 맞추는 데 쓴다 (음성이 없으면 null)
    speech: aiSpeech.speech,
    // 입력은 하위 훅 결과를 통째로 — 낱개 중계를 안 해야 input의 반환 형태에 flow가 결합하지 않는다
    input,
    abandon,
  };
};
