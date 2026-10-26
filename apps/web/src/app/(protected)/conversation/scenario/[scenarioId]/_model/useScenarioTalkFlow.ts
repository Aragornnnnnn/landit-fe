// 시나리오 대화 흐름 훅 — 대화 엔진에 시나리오 세션·제출 API를 배선하고,
// 완료 판정(progress.completed)과 완료 후속(피드백 예열·다음 대화 해금·스트릭)을 맡는다.
// 오프닝은 시나리오(리스트 캐시)의 openingPreview로 즉시 시드하고, 세션 시작은 백그라운드로 돌려
// 진입을 막지 않는다.
'use client';

import { useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';

import { useConversationTurns } from '@/features/conversation/model/useConversationTurns';
import { prepareFeedbackSummary } from '@/features/feedback/model/useSessionFeedbackQuery';
// 대화 완료가 환급액도 늘린다 — 완료를 아는 곳이 여기뿐이라 가로 import를 둔다
import type { RewardCompletion } from '@/features/reward/api/reward';
import { refreshRewardAfterCompletion } from '@/features/reward/model/refresh-reward';
// 첫 완료 뒤 홈에서 소감을 묻는다 — 완료를 아는 곳이 여기뿐이라 가로 import를 둔다
import { markTalkCompleted } from '@/features/satisfaction/model/prompt-record';
import type {
  AnswerGuide,
  DailyScenarioResponse,
} from '@/features/scenario/api/daily';
import type { Scenario } from '@/features/scenario/lib/to-scenario';
import { scenarioKeys } from '@/features/scenario/model/keys';
// 대화 완료가 스트릭도 늘린다 — 완료를 아는 곳이 여기뿐이라 가로 import를 둔다
import { refreshStreakAfterCompletion } from '@/features/streak/model/refresh-streak';
import { track } from '@/shared/analytics';
import { getCurrentUserId } from '@/shared/auth/auth-store';

import { submitScenarioTalkMessage } from '../_api/scenario-session';
import {
  hasCompletedScenarioBefore,
  notifyFirstScenarioCompleted,
} from './first-scenario-ad-event';
import { toTalkGauge } from './talk-gauge';
import { useScenarioTalkSession } from './useScenarioTalkSession';

// 오늘의 시나리오를 처음 끝내는 것인가 — 환급은 그 대화에만 쌓인다. 오늘 것이 무엇인지 받아 둔 적이 없으면(바로 들어온 링크) 아니라고 본다.
// 캐시를 버리기 전에 물어야 한다 — 버린 뒤에는 끝내기 전의 값이 남아 있다는 보장이 없다
const isTodaysFirstCompletion = (
  queryClient: QueryClient,
  scenario: Scenario,
) => {
  const today = queryClient.getQueryData<DailyScenarioResponse>(
    scenarioKeys.daily(getCurrentUserId(), null),
  );
  return (
    !scenario.completed && today?.scenario?.scenarioId === scenario.scenarioId
  );
};

export const useScenarioTalkFlow = (scenario: Scenario) => {
  const preview = scenario.openingPreview;
  const voice = preview?.character?.ttsVoice ?? null;
  // 상대는 시나리오가 정한다 — 세션 응답을 기다리지 않는다. 배정이 없으면(음성 없는 시나리오) 마르코
  const partner = preview?.character?.characterId ?? 'marco';

  // 오프닝은 세션을 기다리지 않고 시나리오에서 바로 시드한다 — 세션 응답의 첫 발화는 폴백
  const [opening, setOpening] = useState(() =>
    scenario.firstSpeaker === 'AI' && preview?.aiOpeningMessage
      ? {
          content: preview.aiOpeningMessage,
          translatedContent: preview.aiOpeningMessageTranslation,
        }
      : null,
  );

  // 답변 가이드는 응답에 실린 그 질문 문장과 짝지어 둔다 — 화면의 질문이 그 문장일 때만 보인다.
  // 제출 응답은 속마음보다 먼저 오므로, 짝이 없으면 이전 질문 카드에 다음 질문 가이드가 붙는다
  const [pairedGuide, setPairedGuide] = useState<{
    question: string;
    answerGuide: AnswerGuide;
  } | null>(() =>
    preview?.answerGuide && opening
      ? { question: opening.content, answerGuide: preview.answerGuide }
      : null,
  );

  // 세션 수명(백그라운드 시작·확보 대기·중도 종료)은 훅 안에 — 여기서는 오프닝 폴백만 받는다
  const session = useScenarioTalkSession(scenario, {
    onOpeningMessage: ({ answerGuide, ...message }) => {
      setOpening((prev) => prev ?? message);
      if (answerGuide)
        setPairedGuide(
          (prev) => prev ?? { question: message.content, answerGuide },
        );
    },
  });

  const queryClient = useQueryClient();

  // 가이드를 열어 본 턴 — 레벨 평가가 그 답변을 가이드에 기대 말한 것인지 따로 본다
  const guideViewedTurnsRef = useRef(new Set<number>());

  // 턴마다 처음 낼 때 정한 발화 식별자·가이드 열람 여부 — 응답이 끊겨 다시 보낼 때 같은 값을 써야
  // 서버가 재전송으로 알아보고 처음 만든 응답을 돌려준다 (마지막 턴이면 이미 끝난 세션이어도). 열람 여부가 바뀌면 거절한다
  const submissionsRef = useRef(
    new Map<number, { clientMessageId: string; guideViewed: boolean }>(),
  );
  const submissionFor = (turnIndex: number) => {
    const issued = submissionsRef.current.get(turnIndex);
    if (issued) return issued;
    const created = {
      clientMessageId: crypto.randomUUID(),
      guideViewed: guideViewedTurnsRef.current.has(turnIndex),
    };
    submissionsRef.current.set(turnIndex, created);
    return created;
  };

  // 대화가 완료되면: 피드백을 미리 생성 요청(prefetch)해 화면 진입 시 즉시 뜨게 하고,
  // 해금된 다음 시나리오(다음 대화)가 홈에 반영되도록 시나리오 캐시를 무효화한다.
  // 오늘 열매가 채워진 것도 이 순간이라, 스트릭은 새 값을 미리 받아 둔다 —
  // 버리기만 하면 홈으로 돌아왔을 때 옛 숫자를 먼저 그리고 응답이 온 뒤 번쩍인다.
  const prepareFeedbackAndUnlock = (
    finishedSessionId: number,
    receipt: RewardCompletion | undefined,
  ) => {
    // 오늘 것을 처음 끝낸 것인지는 시나리오 캐시를 버리기 전에 묻는다
    const todaysFirst = isTodaysFirstCompletion(queryClient, scenario);
    void prepareFeedbackSummary(queryClient, finishedSessionId);
    void queryClient.invalidateQueries({ queryKey: scenarioKeys.all });
    refreshStreakAfterCompletion(queryClient);
    // 환급 참여자는 이 완료로 금액이 쌓인다 — 홈에 돌아왔을 때 새 금액이 서 있도록 미리 받는다
    refreshRewardAfterCompletion(queryClient, { todaysFirst, receipt });
  };

  const engine = useConversationTurns({
    firstSpeaker: scenario.firstSpeaker,
    voice,
    opening,
    openingInstruction: preview?.userOpeningInstruction ?? null,
    // 오프닝 소리는 서버가 준 첫 질문 음원 — 없으면 엔진이 합성으로 말한다
    openingAudioSrc: preview?.questionAudioUrl ?? null,
    sessionId: session.sessionId,
    ensureSession: session.ensure,
    submit: async ({ sessionId, content, inputType, turnIndex }) => {
      const { clientMessageId, guideViewed } = submissionFor(turnIndex);
      const completedBefore = hasCompletedScenarioBefore(queryClient);
      const res = await submitScenarioTalkMessage(
        sessionId,
        content,
        inputType,
        clientMessageId,
        guideViewed,
      );
      track(EVENTS.SCENARIO_TALK_TURN_COMPLETED, {
        session_id: sessionId,
        scenario_id: scenario.scenarioId,
        turn_index: turnIndex,
        input_type: inputType === 'VOICE' ? 'voice' : 'text',
        char_count: content.length,
      });
      const next = res.nextMessage;
      setPairedGuide(
        next?.answerGuide
          ? { question: next.content, answerGuide: next.answerGuide }
          : null,
      );
      // 마지막 발화였다면 피드백을 미리 만들고 다음 대화 해금을 홈에 반영한다
      if (res.progress.completed) {
        track(EVENTS.SCENARIO_TALK_COMPLETED, {
          session_id: sessionId,
          scenario_id: scenario.scenarioId,
          turn_count: res.progress.totalQuestionCount,
        });
        prepareFeedbackAndUnlock(sessionId, res.reward);
        markTalkCompleted('scenario');
        notifyFirstScenarioCompleted(completedBefore);
      }
      return {
        submittedMessage: res.submittedMessage,
        nextMessage: res.nextMessage,
        completed: res.progress.completed,
      };
    },
  });

  // 중도 이탈 (정상 완료는 서버가 판정하므로 세션을 끝내지 않는다)
  const leave = () => {
    track(EVENTS.SCENARIO_TALK_ABANDONED, {
      session_id: session.sessionId ?? undefined,
      scenario_id: scenario.scenarioId,
      turn_index: engine.turnIndex,
    });
    engine.abandon(); // 진행 중인 속마음 폴링을 멈춘다
    session.end();
  };

  // 지금 질문에서 가이드를 열었다 — 이 턴의 답변에 열람했다고 실어 보낸다
  const markGuideViewed = () => {
    guideViewedTurnsRef.current.add(engine.turnIndex);
  };

  return {
    ...engine,
    partner,
    leave,
    markGuideViewed,
    // 게이지는 화면에 떠 있는 카드를 따른다 — 답한 횟수를 따로 세면 카드보다 먼저 움직인다
    gauge: toTalkGauge({
      turnIndex: engine.turnIndex,
      firstSpeaker: scenario.firstSpeaker,
      totalQuestionCount: session.totalQuestionCount,
    }),
    answerGuide:
      pairedGuide?.question === engine.turn.aiMessage
        ? pairedGuide.answerGuide
        : null,
    // DONE 시점엔 세션이 확보돼 있다 — 피드백 생성에 쓴다 (없으면 세션 시작이 실패한 경우)
    sessionId: session.sessionId,
  };
};
