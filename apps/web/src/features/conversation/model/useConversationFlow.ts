// 대화 플로우 훅 — 상태 기계를 세션 API·입력(STT/키보드)·발화 재생에 배선한다 (시작·발화 제출·종료)
// 오프닝은 시나리오(리스트 캐시)의 openingPreview로 즉시 시드하고, 세션 시작은 백그라운드로 돌려
// 진입을 막지 않는다. 세션은 발화 제출 때 필요한 sessionId 확보용.
'use client';

import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useQueryClient } from '@tanstack/react-query';

import { prefetchSessionFeedback } from '@/features/feedback/model/useSessionFeedbackQuery';
import type { Scenario } from '@/features/scenario/lib/to-scenario';
import { scenarioKeys } from '@/features/scenario/model/keys';
// 대화 완료가 스트릭도 늘린다 — 완료를 아는 곳이 여기뿐이라 가로 import를 둔다
import { refreshStreakAfterCompletion } from '@/features/streak/model/refresh-streak';
import { track } from '@/shared/analytics';
import { haptic } from '@/shared/haptics';
import { reportError } from '@/shared/monitoring/report';
import { showToast } from '@/shared/ui/toast';

import { submitMessage, type NextMessage } from '../api/session';
import { toPartner } from './character-look';
import {
  initialConversationState,
  nextConversationState,
  type ConversationEvent,
} from './conversation-machine';
import { expressionHoldMs, thoughtHoldMs, toThoughtType } from './pacing';
import type { FloatingThought, ThoughtType } from './thought';
import { useAiSpeech } from './useAiSpeech';
import { useConversationInput } from './useConversationInput';
import { useConversationSession } from './useConversationSession';
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
  const [thought, setThought] = useState<FloatingThought | null>(null);
  // 노출을 끝낸 속마음 — 화면이 표정으로 반응할 수 있게 그 사실만 남긴다.
  // 매번 새 객체라 같은 종류가 연달아 와도 서로 다른 반응으로 구분된다
  const [finishedThought, setFinishedThought] =
    useState<FloatingThought | null>(null);

  // send 클로저가 최신 값을 읽도록 ref로 들고 있는다
  const completedRef = useRef(false); // 그 발화를 끝으로 대화가 종료되는가
  const nextMessageRef = useRef<NextMessage | null>(null);
  const submittingRef = useRef(false); // 중복 제출 방지 (연출은 AI_THINKING phase가 맡는다)

  // 세션 수명(백그라운드 시작·확보 대기·중도 종료)은 훅 안에 — 여기서는 오프닝 폴백만 받는다
  const session = useConversationSession(scenario, {
    onOpeningMessage: (message) => setAiMessage((prev) => prev ?? message),
  });

  const innerThought = useInnerThought();
  const queryClient = useQueryClient();

  // 대화가 완료되면: 피드백을 미리 생성 요청(prefetch)해 화면 진입 시 즉시 뜨게 하고,
  // 해금된 다음 시나리오(다음 대화)가 홈에 반영되도록 시나리오 캐시를 무효화한다.
  // 오늘 열매가 채워진 것도 이 순간이라, 스트릭은 새 값을 미리 받아 둔다 —
  // 버리기만 하면 홈으로 돌아왔을 때 옛 숫자를 먼저 그리고 응답이 온 뒤 번쩍인다.
  const prepareFeedbackAndUnlock = (finishedSessionId: number) => {
    void prefetchSessionFeedback(queryClient, finishedSessionId);
    void queryClient.invalidateQueries({ queryKey: scenarioKeys.all });
    refreshStreakAfterCompletion(queryClient);
  };

  const send = (event: ConversationEvent) =>
    setState((prev) =>
      nextConversationState(prev, event, completedRef.current),
    );

  // AI 발화 재생 — 끝나면 상태기계에 알린다 (오프닝 mp3·TTS 합성·타이머 폴백은 훅 안에)
  const aiSpeech = useAiSpeech({
    playing: state.phase === 'AI_SPEAKING' && aiMessage != null,
    content: aiMessage?.content ?? null,
    voice,
    scenarioId: scenario.scenarioId,
    onSpeechEnd: () => send('AI_SPEAKING_DONE'),
  });

  // 유저 입력 — 마이크/키보드 전환과 STT 배선은 훅 안에, 여기서는 상태 전이와 제출만 잇는다
  const input = useConversationInput({
    canStart: state.phase === 'USER_READY',
    trackContext: () => ({
      sessionId: session.sessionId,
      turnIndex: state.turnIndex,
    }),
    onInputStart: () => send('USER_SPEAKING_STARTED'),
    onInputCancel: () => send('USER_SPEAKING_CANCELLED'),
    onContent: (content, inputType) => void submitContent(content, inputType),
  });

  // 다음 질문을 화면에 올리고 턴을 넘긴다 — 속마음 노출을 마쳤을 때와 건너뛸 때가 공유한다
  const startNextTurn = (
    event: 'INNER_THOUGHT_DONE' | 'AI_RESPONSE_SKIPPED',
  ) => {
    input.resetForNextTurn();
    if (event === 'INNER_THOUGHT_DONE' && thought) setFinishedThought(thought);
    setThought(null);
    if (nextMessageRef.current) {
      setAiMessage({
        content: nextMessageRef.current.content,
        translatedContent: nextMessageRef.current.translatedContent,
      });
      nextMessageRef.current = null;
      aiSpeech.markDynamic();
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
  ) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    send('USER_SPEAKING_DONE'); // → AI_THINKING (상대가 생각 중)
    try {
      // 반환하는 sessionId state와 다른 값 — 백그라운드 시작이 아직이면 확보를 기다린 결과
      const activeSessionId = await session.ensure();
      if (activeSessionId == null) {
        console.error('세션이 없어 제출할 수 없어요');
        haptic('error');
        send('AI_RESPONSE_FAILED');
        showToast('연결에 문제가 생겼어요. 잠시 후 다시 시도해 주세요');
        track(EVENTS.TURN_FAILED, {
          turn_index: state.turnIndex,
          reason: 'api_error',
        });
        return;
      }

      const res = await submitMessage(activeSessionId, content, inputType);
      track(EVENTS.TURN_COMPLETED, {
        session_id: activeSessionId,
        scenario_id: scenario.scenarioId,
        turn_index: state.turnIndex,
        input_type: inputType === 'VOICE' ? 'voice' : 'text',
        char_count: content.length,
      });
      // 종료 인사도 nextMessage로 오고, 그 인사를 끝으로 종료인지는 completed가 알려준다 (인사 재생 후 CTA)
      nextMessageRef.current = res.nextMessage;
      completedRef.current = res.progress.completed;
      // 마지막 발화였다면 피드백을 미리 만들고 다음 대화 해금을 홈에 반영한다
      if (res.progress.completed) {
        track(EVENTS.CONVERSATION_COMPLETED, {
          session_id: activeSessionId,
          scenario_id: scenario.scenarioId,
          turn_count: res.progress.totalQuestionCount,
        });
        prepareFeedbackAndUnlock(activeSessionId);
      }
      // 다음 질문이 오면 속마음을 기다리지 않고 바로 미리 합성한다 — 다음 발화 재생 지연을 없앤다
      if (res.nextMessage) aiSpeech.prefetch(res.nextMessage.content);
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
      console.error('발화 제출 실패', error);
      reportError(error);
      haptic('error');
      send('AI_RESPONSE_FAILED'); // → USER_READY (다시 시도)
      showToast('전송에 실패했어요. 다시 시도해 주세요');
      track(EVENTS.TURN_FAILED, {
        session_id: session.sessionId ?? undefined,
        turn_index: state.turnIndex,
        reason: 'api_error',
      });
    } finally {
      submittingRef.current = false;
    }
  };

  // 중도 이탈 (정상 완료는 서버가 판정하므로 세션을 끝내지 않는다)
  const leave = () => {
    track(EVENTS.CONVERSATION_ABANDONED, {
      session_id: session.sessionId ?? undefined,
      scenario_id: scenario.scenarioId,
      turn_index: state.turnIndex,
    });
    innerThought.cancel(); // 진행 중인 속마음 폴링을 멈춘다
    session.end();
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

  // 상대 캐릭터는 시나리오 TTS 음성이 정한다 — 지정(character)이 우선, 없으면 성별
  const partner = toPartner(voice);

  return {
    phase: state.phase,
    turn,
    partner,
    finishedThought,
    // 지금 소리 나는 발화 — 캐릭터가 입모양을 맞추는 데 쓴다 (음성이 없으면 null)
    speech: aiSpeech.speech,
    // 입력은 하위 훅 결과를 통째로 — 낱개 중계를 안 해야 input의 반환 형태에 flow가 결합하지 않는다
    input,
    leave,
    // DONE 시점엔 세션이 확보돼 있다 — 피드백 생성에 쓴다 (없으면 세션 시작이 실패한 경우)
    sessionId: session.sessionId,
  };
};
