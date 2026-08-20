// 시나리오 대화 흐름 훅 — 대화 엔진에 시나리오 세션·제출 API를 배선하고,
// 완료 판정(progress.completed)과 완료 후속(피드백 예열·다음 대화 해금·스트릭)을 맡는다.
// 오프닝은 시나리오(리스트 캐시)의 openingPreview로 즉시 시드하고, 세션 시작은 백그라운드로 돌려
// 진입을 막지 않는다.
'use client';

import { useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useQueryClient } from '@tanstack/react-query';

import { useConversationTurns } from '@/features/conversation/model/useConversationTurns';
import { prefetchSessionFeedback } from '@/features/feedback/model/useSessionFeedbackQuery';
// 첫 완료 뒤 홈에서 소감을 묻는다 — 완료를 아는 곳이 여기뿐이라 가로 import를 둔다
import { markTalkCompleted } from '@/features/satisfaction/model/prompt-record';
import type { Scenario } from '@/features/scenario/lib/to-scenario';
import { scenarioKeys } from '@/features/scenario/model/keys';
// 대화 완료가 스트릭도 늘린다 — 완료를 아는 곳이 여기뿐이라 가로 import를 둔다
import { refreshStreakAfterCompletion } from '@/features/streak/model/refresh-streak';
import { track } from '@/shared/analytics';

import { submitScenarioTalkMessage } from '../_api/scenario-session';
import { useScenarioTalkSession } from './useScenarioTalkSession';

export const useScenarioTalkFlow = (scenario: Scenario) => {
  const preview = scenario.openingPreview;
  const voice = preview?.ttsVoice ?? null;
  // 상대는 시나리오가 정한다 — 세션 응답을 기다리지 않는다. 배정이 없으면(음성 없는 시나리오) 마르코
  const partner = preview?.characterId ?? 'marco';

  // 오프닝은 세션을 기다리지 않고 시나리오에서 바로 시드한다 — 세션 응답의 첫 발화는 폴백
  const [opening, setOpening] = useState(() =>
    scenario.firstSpeaker === 'AI' && preview?.aiOpeningMessage
      ? {
          content: preview.aiOpeningMessage,
          translatedContent: preview.aiOpeningMessageTranslation,
        }
      : null,
  );

  // 세션 수명(백그라운드 시작·확보 대기·중도 종료)은 훅 안에 — 여기서는 오프닝 폴백만 받는다
  const session = useScenarioTalkSession(scenario, {
    onOpeningMessage: (message) => setOpening((prev) => prev ?? message),
  });

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

  const engine = useConversationTurns({
    firstSpeaker: scenario.firstSpeaker,
    voice,
    opening,
    openingInstruction: preview?.userOpeningInstruction ?? null,
    openingAudioSrc: `/audio/opening-${scenario.scenarioId}.mp3`,
    sessionId: session.sessionId,
    ensureSession: session.ensure,
    submit: async ({ sessionId, content, inputType, turnIndex }) => {
      const res = await submitScenarioTalkMessage(
        sessionId,
        content,
        inputType,
      );
      track(EVENTS.SCENARIO_TALK_TURN_COMPLETED, {
        session_id: sessionId,
        scenario_id: scenario.scenarioId,
        turn_index: turnIndex,
        input_type: inputType === 'VOICE' ? 'voice' : 'text',
        char_count: content.length,
      });
      // 마지막 발화였다면 피드백을 미리 만들고 다음 대화 해금을 홈에 반영한다
      if (res.progress.completed) {
        track(EVENTS.SCENARIO_TALK_COMPLETED, {
          session_id: sessionId,
          scenario_id: scenario.scenarioId,
          turn_count: res.progress.totalQuestionCount,
        });
        prepareFeedbackAndUnlock(sessionId);
        markTalkCompleted('scenario');
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

  return {
    ...engine,
    partner,
    leave,
    // DONE 시점엔 세션이 확보돼 있다 — 피드백 생성에 쓴다 (없으면 세션 시작이 실패한 경우)
    sessionId: session.sessionId,
  };
};
