// 롤플레이 대화 흐름 훅 — 대화 엔진에 롤플레이 제출·완료 API를 배선한다. 스몰톡 흐름과 다른 것은 셋이다.
// (1) 속마음이 없다 — 제출 응답을 "속마음 없음"으로 넘겨 엔진이 바로 다음 발화로 간다
// (2) 작별 인사로도, 시간 소진으로도 서버가 끝내지 않는다 — 완료는 X(끝내기 시트)뿐이다.
//     오늘 시간을 다 써 다음 발화가 거절되면 더 말할 수 없으니 그 자리에서 끝낸다
// (3) 끝나면 축하(열매)가 붙은 오늘의 롤플레이로 간다.
// 중도 종료 API는 롤플레이 세션을 받지 않는다(404) — 한 마디도 안 하고 나가면 서버엔 아무것도 보내지 않는다
'use client';

import { useRef, useState } from 'react';
import { EVENTS, type EventProps } from '@landit/analytics';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { preload } from 'react-dom';

import type { Partner } from '@/features/conversation/model/character-look';
import { CHARACTER_KEYTERMS } from '@/features/conversation/model/stt-keyterms';
import { useConversationTurns } from '@/features/conversation/model/useConversationTurns';
import {
  completeRoleplaySession,
  submitRoleplayMessage,
  type RoleplayProgress,
  type RoleplaySessionStartResponse,
} from '@/features/roleplay/api/roleplay';
import { prefetchRoleplaySummary } from '@/features/roleplay/model/useRoleplaySummaryQuery';
import { smallTalkKeys } from '@/features/small-talk/model/keys';
import { SUMMARY_IMAGE_SOURCES } from '@/features/small-talk/model/randi-pose';
import { useSpeakingBudget } from '@/features/small-talk/model/useSpeakingBudget';
import { refreshStreakAfterCompletion } from '@/features/streak/model/refresh-streak';
import { track } from '@/shared/analytics';
import { ApiError } from '@/shared/api/api-error';
import { useCurrentUserId } from '@/shared/auth/current-member';
import { reportError } from '@/shared/monitoring/report';
import { showToast } from '@/shared/ui/toast';

interface RoleplayTalkFlowOptions {
  session: RoleplaySessionStartResponse;
  // 시나리오의 상대 — 계측·화면 표시용. 목소리는 세션 응답 ttsVoice가 정본이다
  partner: Partner;
  goHome: () => void;
  // 완료 뒤 오늘의 롤플레이로
  showSummary: () => void;
}

export const useRoleplayTalkFlow = ({
  session,
  partner,
  goHome,
  showSummary,
}: RoleplayTalkFlowOptions) => {
  const t = useTranslations('conversation.roleplayFlow');
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  const [progress, setProgress] = useState<RoleplayProgress | null>(null);
  // 서버가 받아 준 내 발화 수 — 0이면 남길 대화가 없어 끝내기 대신 그냥 나간다
  const [answeredTurns, setAnsweredTurns] = useState(0);
  // 발화를 보냈는가 — 응답 전이라도 서버는 이미 받아 저장했으니, 그 뒤의 X는 그냥 나가지 않고 끝내기로 묻는다
  const sentRef = useRef(false);
  // 주고받은 말의 수 — 서버가 매기는 메시지 순번이 곧 그 수다. 상대가 먼저 한 마디 하고 시작한다
  const [exchangeCount, setExchangeCount] = useState(1);
  // 턴마다 하나씩 붙이는 발화 식별자 — 실패 후 다시 보낼 때 같은 값을 써야 서버가 재전송으로 알아본다
  const clientMessageIdsRef = useRef(new Map<number, string>());
  // 오늘 남은 시간이 줄었다 — 스몰톡과 하루 시간을 같이 써서, 스몰톡 홈이 옛 숫자를 먼저 그리지 않게 한다
  const refreshSmallTalkHome = () =>
    void queryClient.invalidateQueries({
      queryKey: smallTalkKeys.main(userId),
    });
  // 끝내기가 완료를 맡았는가 — 켜지면 이후 발화는 보내지 않고, 늦게 온 응답·실패도 버린다
  const directEndStartedRef = useRef(false);
  // 완료 후속을 이미 했는가 — 시간 소진으로 끝난 뒤 끝내기가 와도 두 번 하지 않는다
  const settledRef = useRef(false);
  const leftRef = useRef(false);
  const talkClosed = () => directEndStartedRef.current || leftRef.current;
  const [completing, setCompleting] = useState(false);
  const clientMessageIdFor = (turnIndex: number) => {
    const issued = clientMessageIdsRef.current.get(turnIndex);
    if (issued) return issued;
    const created = crypto.randomUUID();
    clientMessageIdsRef.current.set(turnIndex, created);
    return created;
  };

  const engine = useConversationTurns({
    // 롤플레이는 상대가 늘 먼저 말을 건다
    firstSpeaker: 'AI',
    voice: session.character?.ttsVoice ?? null,
    opening: {
      content: session.currentMessage.content,
      translatedContent: session.currentMessage.translatedContent,
    },
    openingInstruction: null,
    // 매번 다른 첫 마디라 미리 녹음해 둘 게 없다 — 오프닝도 합성으로 말한다
    openingAudioSrc: null,
    sessionId: session.sessionId,
    ensureSession: async () => session.sessionId,
    keytermsFor: () => CHARACTER_KEYTERMS,
    submit: async ({ content, inputType, turnIndex, utteranceDurationMs }) => {
      if (talkClosed()) return null;
      let result;
      sentRef.current = true;
      try {
        result = await submitRoleplayMessage(session.sessionId, {
          clientMessageId: clientMessageIdFor(turnIndex),
          content,
          inputType,
          utteranceDurationMs,
        });
      } catch (cause) {
        if (talkClosed()) return null; // 이미 손을 뗀 대화 — 이 실패는 볼 일이 없다
        // 오늘 말할 시간을 다 썼다 — 다시 보내도 같은 거절이라, 알리고 지금까지로 끝낸다
        if (isSpeakingLimitExceeded(cause)) {
          showToast(t('limitReachedToast'));
          void finishTalk('time_limit');
          return null;
        }
        throw cause;
      }
      if (talkClosed()) return null; // 응답을 기다리는 사이 손을 뗐다
      setAnsweredTurns(turnIndex + 1);
      refreshSmallTalkHome();
      setProgress(result.progress);
      budget.settle(result.progress.remainingSpeakingTimeMs);
      setExchangeCount(
        result.nextMessage?.messageSequence ??
          result.submittedMessage.messageSequence,
      );
      track(EVENTS.ROLEPLAY_TURN_COMPLETED, {
        session_id: session.sessionId,
        partner,
        turn_index: turnIndex,
        input_type: inputType === 'VOICE' ? 'voice' : 'text',
        char_count: content.length,
        utterance_duration_ms: utteranceDurationMs,
      });

      // COMPLETED는 이 대화가 다른 곳(다른 기기·탭의 끝내기)에서 먼저 끝났다는 뜻이다 — 다음 발화가 없다.
      // 엔진에 넘기면 직전 대사를 다시 읽으니, 손을 떼고 바로 요약으로 간다
      if (result.turnStatus === 'COMPLETED') {
        directEndStartedRef.current = true;
        engine.abandon();
        settleCompletion({
          turnCount: turnIndex + 1,
          speakingDurationMs: result.progress.accumulatedSpeakingDurationMs,
          endReason: 'ended_elsewhere',
        });
        showSummary();
        return null;
      }

      return {
        // 속마음이 없는 대화다 — 준비된 빈 속마음으로 넘기면 엔진이 기다리지 않고 다음 발화로 간다
        submittedMessage: {
          ...result.submittedMessage,
          innerThoughtProcessingStatus: 'COMPLETED',
          innerThought: null,
          innerThoughtType: null,
        },
        nextMessage: result.nextMessage,
        completed: false,
      };
    },
  });

  // 남은 시간 눈금 — 스몰톡과 같은 규칙. 마이크가 켜져 있는 동안만 깎고, 보내지 않은 발화는 되돌린다
  const budget = useSpeakingBudget({
    initialMs: session.usage.remainingMs,
    speaking:
      engine.phase === 'USER_SPEAKING' &&
      !engine.input.reviewing &&
      !engine.input.keyboardMode,
    waiting: engine.phase === 'USER_READY',
    listenCount: engine.input.listenCount,
    reviewedDurationMs: engine.input.reviewedDurationMs,
  });

  // 대화가 완료됐다 — 끝내기·시간 소진·다른 곳에서 끝냄 어느 길이든 같은 후속을 한다
  const settleCompletion = ({
    turnCount,
    speakingDurationMs,
    endReason,
  }: {
    turnCount: number;
    speakingDurationMs: number;
    endReason: EventProps['Roleplay Completed']['end_reason'];
  }) => {
    settledRef.current = true;
    track(EVENTS.ROLEPLAY_COMPLETED, {
      session_id: session.sessionId,
      partner,
      turn_count: turnCount,
      speaking_duration_ms: speakingDurationMs,
      end_reason: endReason,
    });
    refreshSmallTalkHome();
    // 축하 화면이 열자마자 새 숫자를 그리도록 미리 받아 둔다
    refreshStreakAfterCompletion(queryClient);
    // 다음 화면(오늘의 롤플레이)이 준비되게 — 요약과 래디 그림을 미리 받는다
    void prefetchRoleplaySummary(queryClient, userId, session.sessionId);
    for (const src of SUMMARY_IMAGE_SOURCES) preload(src, { as: 'image' });
  };

  // 나간다 — 한 마디도 안 한 대화나 끝내기 실패. 서버에 보낼 중도 종료가 없어 화면만 손을 뗀다
  const leave = () => {
    if (leftRef.current) return;
    leftRef.current = true;
    track(EVENTS.ROLEPLAY_ABANDONED, {
      session_id: session.sessionId,
      partner,
      turn_index: engine.turnIndex,
    });
    engine.abandon();
  };

  // X — 끝난 대화면 요약으로, 나눈 대화가 없으면 바로 나가고, 그 밖엔 끝내기 시트로 물어보라고 답한다
  const pressClose = () => {
    if (leftRef.current) return false;
    if (settledRef.current) {
      showSummary();
      return false;
    }
    if (answeredTurns === 0 && !sentRef.current) {
      // 하던 말은 버린다 — 나간 뒤 인식 결과가 도착해 홈 위에 토스트를 띄우지 않게
      if (engine.phase === 'USER_SPEAKING') engine.input.abandonInput();
      leave();
      goHome();
      return false;
    }
    return true;
  };

  // 지금 완료하고 요약으로 — 끝내기 시트와 시간 소진이 같은 길을 쓴다
  const finishTalk = async (
    endReason: EventProps['Roleplay Completed']['end_reason'],
  ) => {
    if (settledRef.current) {
      showSummary();
      return;
    }
    if (talkClosed()) return;
    directEndStartedRef.current = true;
    setCompleting(true);
    if (engine.phase === 'USER_SPEAKING') engine.input.abandonInput();
    engine.abandon();
    try {
      await completeRoleplaySession(session.sessionId);
    } catch (cause) {
      console.warn('[roleplay] 끝내기 전송 실패', cause);
      reportError(cause);
      showToast(t('completeFailedToast'));
      leave();
      goHome();
      return;
    }
    settleCompletion({
      turnCount: answeredTurns,
      speakingDurationMs: progress?.accumulatedSpeakingDurationMs ?? 0,
      endReason,
    });
    showSummary();
  };

  return {
    ...engine,
    // 끝내고 피드백 보기
    completeTalk: () => finishTalk('direct_end'),
    pressClose,
    completing,
    remainingMs: budget.remainingMs,
    speakingRatio: budget.ratio,
    summary: {
      speakingDurationMs: progress?.accumulatedSpeakingDurationMs ?? 0,
      exchangeCount,
    },
  };
};

// 오늘 발화 시간을 다 써 새 발화가 거절됐는가 — 롤플레이는 이때 세션을 끝내지 않고 새 발화만 막는다
const SPEAKING_LIMIT_EXCEEDED = 'FREE_TALK_DAILY_SPEAKING_LIMIT_EXCEEDED';
const isSpeakingLimitExceeded = (cause: unknown) =>
  cause instanceof ApiError && cause.code === SPEAKING_LIMIT_EXCEEDED;
