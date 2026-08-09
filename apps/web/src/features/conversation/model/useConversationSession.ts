'use client';

// 대화 세션 수명 훅 — 진입을 막지 않게 백그라운드로 시작하고, 제출 시점의 확보 대기(ensure)와 중도 종료(end)를 맡는다
import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import * as Sentry from '@sentry/nextjs';

import type { Scenario } from '@/features/scenario/lib/to-scenario';
import { track } from '@/shared/analytics';
import { reportError, reportWarning } from '@/shared/monitoring/report';

import { endSession, startSession } from '../api/session';

interface ConversationSessionOptions {
  // openingPreview로 오프닝을 못 시드했을 때(예외적) 세션 응답의 첫 발화로 채우는 폴백
  onOpeningMessage: (message: {
    content: string;
    translatedContent: string | null;
  }) => void;
}

export const useConversationSession = (
  scenario: Scenario,
  { onOpeningMessage }: ConversationSessionOptions,
) => {
  // state는 화면 노출용, ref는 핸들러 클로저가 최신 값을 읽는 용도
  const [sessionId, setSessionId] = useState<number | null>(null);
  const sessionIdRef = useRef<number | null>(null);
  const promiseRef = useRef<Promise<number | null> | null>(null);
  const startedRef = useRef(false);

  // 시작 effect는 한 번만 도는데 응답은 나중에 온다 — 콜백 최신값을 ref로 잡아 stale closure 방지
  const onOpeningMessageRef = useRef(onOpeningMessage);
  useEffect(() => {
    onOpeningMessageRef.current = onOpeningMessage;
  });

  // 백그라운드 시작 — 화면은 이미 openingPreview로 떴고, 제출 때 쓸 sessionId만 확보한다.
  // StrictMode 이중 실행에도 한 번만 만든다.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    promiseRef.current = startSession(scenario.scenarioId)
      .then((res) => {
        sessionIdRef.current = res.sessionId;
        setSessionId(res.sessionId);
        track(EVENTS.CONVERSATION_STARTED, {
          scenario_id: scenario.scenarioId,
          session_id: res.sessionId,
          first_speaker: scenario.firstSpeaker,
          is_retry: scenario.completed,
        });
        if (res.currentMessage) {
          onOpeningMessageRef.current({
            content: res.currentMessage.content,
            translatedContent: res.currentMessage.translatedContent,
          });
        }
        return res.sessionId;
      })
      .catch((error) => {
        Sentry.addBreadcrumb({
          category: 'conversation',
          message: '세션 시작 실패',
          level: 'warning',
          data: { error: String(error) },
        });
        reportError(error);
        return null;
      });
    // startedRef 가드로 어차피 1회만 실행된다 — 계측 속성 참조로 늘어난 의존성
  }, [scenario.scenarioId, scenario.completed, scenario.firstSpeaker]);

  // 확보 — 이미 있으면 즉시, 백그라운드 시작이 진행 중이면 그 결과를 기다린다 (시작 실패면 null)
  const ensure = async () => sessionIdRef.current ?? (await promiseRef.current);

  // 중도 종료 — 정상 완료는 서버가 판정하므로 부르지 않는다. 미확보 세션은 종료할 것도 없다
  const end = () => {
    if (sessionIdRef.current == null) return;
    endSession(sessionIdRef.current).catch((error) => {
      Sentry.addBreadcrumb({
        category: 'conversation',
        message: '세션 종료 실패',
        level: 'warning',
        data: { error: String(error) },
      });
      reportWarning(error);
    });
  };

  return { sessionId, ensure, end };
};
