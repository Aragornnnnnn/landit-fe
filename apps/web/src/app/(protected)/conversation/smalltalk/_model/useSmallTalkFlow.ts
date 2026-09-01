// 스몰톡 대화 흐름 훅 — 대화 엔진에 스몰톡 세션·제출 API를 배선하고, 스몰톡에만 있는 두 가지를 맡는다.
// (1) 발화 응답이 종료 확인(EXIT_CONFIRMATION_REQUIRED)이면 END로 답해 대화를 닫는다
// (2) 오늘 남은 발화 시간을 들고 있다가, 말하는 동안 줄이고 제출 후 서버 값으로 정정한다
'use client';

import { useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useQueryClient } from '@tanstack/react-query';

import type { Partner } from '@/features/conversation/model/character-look';
import { useConversationTurns } from '@/features/conversation/model/useConversationTurns';
// 첫 완료 뒤 스몰톡 탭에서 소감을 묻는다 — 완료를 아는 곳이 여기뿐이라 가로 import를 둔다
import { markTalkCompleted } from '@/features/satisfaction/model/prompt-record';
import {
  decideSmallTalkExit,
  submitSmallTalkMessage,
  type SmallTalkProgress,
  type SmallTalkSessionStartResponse,
} from '@/features/small-talk/api/small-talk';
import { smallTalkKeys } from '@/features/small-talk/model/keys';
import { refreshStreakAfterCompletion } from '@/features/streak/model/refresh-streak';
// 대화 직후 위젯 재유도를 물을 차례를 남긴다 — 완료를 아는 곳이 여기뿐이라 가로 import를 둔다
import { track } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';
import { reportError } from '@/shared/monitoring/report';
import { showToast } from '@/shared/ui/toast';

import { useSpeakingBudget } from './useSpeakingBudget';

// 내가 먼저 걸 때 카드에 뜨는 안내 — 시나리오와 달리 읽을 상황이 없어서 주제부터 열어 준다
const USER_OPENING_INSTRUCTION =
  '오늘 있었던 일이든 요즘 관심사든, 먼저 말을 걸어보세요';

interface SmallTalkFlowOptions {
  session: SmallTalkSessionStartResponse;
  // 홈에서 고른 상대 — 계측·화면 표시용. 목소리는 세션 응답 ttsVoice가 정본이다
  partner: Partner;
  // 진입 시점의 오늘 남은 발화 시간
  remainingSpeakingTimeMs: number;
  // 중도 이탈 시 세션 정리 — 세션을 만든 쪽(화면)이 소유한다
  endSession: () => void;
  // 대화를 접고 홈으로 — 종료 확인을 못 보내 대화가 멈춰 버렸을 때 이 길로 빠져나간다
  goHome: () => void;
}

export const useSmallTalkFlow = ({
  session,
  partner,
  remainingSpeakingTimeMs,
  endSession,
  goHome,
}: SmallTalkFlowOptions) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  // 마지막 제출이 알려준 진행 상태 — 종료 화면의 "얘기한 시간"이 여기서 나온다
  const [progress, setProgress] = useState<SmallTalkProgress | null>(null);
  // 주고받은 말의 수 — 서버가 매기는 메시지 순번이 곧 그 수다
  const [exchangeCount, setExchangeCount] = useState(
    session.currentMessage ? 1 : 0,
  );
  // 턴마다 하나씩 붙이는 발화 식별자 — 실패 후 다시 보낼 때 같은 값을 써야
  // 서버가 재전송으로 알아보고 이미 접수한 발화를 두 번 세지 않는다
  const clientMessageIdsRef = useRef(new Map<number, string>());
  const clientMessageIdFor = (turnIndex: number) => {
    const issued = clientMessageIdsRef.current.get(turnIndex);
    if (issued) return issued;
    const created = crypto.randomUUID();
    clientMessageIdsRef.current.set(turnIndex, created);
    return created;
  };

  // 오늘 남은 시간이 줄었다 — 홈이 옛 숫자를 먼저 그리지 않게 다시 받아 둔다 (캐시는 30초를 신선하게 본다)
  const refreshHome = () =>
    void queryClient.invalidateQueries({
      queryKey: smallTalkKeys.main(userId),
    });

  // 종료 확인에 대한 답. END를 보내면 서버가 마무리 인사와 함께 세션을 완료한다.
  // 사용자에게 다시 묻지 않으므로 CONTINUE(서버가 작별 인사로 잘못 판정했을 때의 정정)는 보내지 않는다.
  // 이 요청이 실패하면 세션은 답을 기다리는 상태로 남아 다음 발화도 못 받는다 — 나가는 것으로 정리한다
  const sendExitDecision = async (submittedMessageId: number) => {
    try {
      return await decideSmallTalkExit(session.sessionId, {
        submittedMessageId,
        decision: 'END',
      });
    } catch (cause) {
      console.warn('[smalltalk] 종료 확인 전송 실패', cause);
      reportError(cause);
      showToast('연결에 문제가 생겨 대화를 이어가지 못했어요');
      leave();
      goHome();
      return null;
    }
  };

  const engine = useConversationTurns({
    firstSpeaker: session.startMode === 'AI_FIRST' ? 'AI' : 'USER',
    // 캐릭터별 목소리는 서버(conversation_character)가 정본이다 — 세션 시작이 고른 상대의 보이스를 내려준다
    voice: session.character?.ttsVoice ?? null,
    opening: session.currentMessage && {
      content: session.currentMessage.content,
      translatedContent: session.currentMessage.translatedContent,
    },
    openingInstruction:
      session.startMode === 'USER_FIRST' ? USER_OPENING_INSTRUCTION : null,
    // 스몰톡은 매번 다른 첫 마디라 미리 녹음해 둘 게 없다 — 오프닝도 합성으로 말한다
    openingAudioSrc: null,
    sessionId: session.sessionId,
    ensureSession: async () => session.sessionId,
    submit: async ({ content, inputType, turnIndex, utteranceDurationMs }) => {
      let result = await submitSmallTalkMessage(session.sessionId, {
        clientMessageId: clientMessageIdFor(turnIndex),
        content,
        inputType,
        utteranceDurationMs,
        // 시간이 다 돼서 우리가 말을 끊었는가 (서버는 참고만 하고 자기 잔량으로 판단한다)
        timeLimitReached: budget.remainingMs === 0,
      });

      // 종료 확인 — 이 응답에는 다음 발화도 속마음도 없다. 답을 보내야 그 자리가 채워진다
      if (result.turnStatus === 'EXIT_CONFIRMATION_REQUIRED') {
        const decided = await sendExitDecision(
          result.submittedMessage.messageId,
        );
        if (!decided) return null; // 전송 실패로 나가는 중 — 엔진도 손을 뗀다
        result = decided;
      }

      setProgress(result.progress);
      budget.settle(result.progress.remainingSpeakingTimeMs);
      setExchangeCount(
        result.nextMessage?.messageSequence ??
          result.submittedMessage.messageSequence,
      );
      track(EVENTS.SMALL_TALK_TURN_COMPLETED, {
        session_id: session.sessionId,
        partner,
        turn_index: turnIndex,
        input_type: inputType === 'VOICE' ? 'voice' : 'text',
        char_count: content.length,
        utterance_duration_ms: utteranceDurationMs,
      });

      const completed = result.turnStatus === 'COMPLETED';
      if (completed) {
        track(EVENTS.SMALL_TALK_COMPLETED, {
          session_id: session.sessionId,
          partner,
          turn_count: turnIndex + 1,
          speaking_duration_ms: result.progress.accumulatedSpeakingDurationMs,
          // 예산이 0이 된 턴은 서버가 스스로 닫은 것 — 사용자가 인사로 끝낸 것과 구분한다
          end_reason:
            result.progress.remainingSpeakingTimeMs === 0
              ? 'time_limit'
              : 'user_ended',
        });
        refreshHome();
        // 축하 화면이 열자마자 새 숫자를 그리도록 미리 받아 둔다 (시나리오 대화와 같은 처리)
        refreshStreakAfterCompletion(queryClient);
        markTalkCompleted('smalltalk');
      }

      return {
        submittedMessage: result.submittedMessage,
        nextMessage: result.nextMessage,
        completed,
      };
    },
  });

  // 남은 시간 눈금 — 말하는 동안 깎이고, 보내지 않은 발화(취소·인식 실패·제출 실패)는 되돌아온다.
  // 시간이 0이 돼도 하던 말은 끊지 않는다 — 노래방 마지막 곡처럼, 시작한 발화는 끝까지 간다.
  // 서버도 예약 차감이라 초과분을 받아 주고(잔량은 0에서 멈춘다), 그 턴을 작별 인사로 닫는다
  const budget = useSpeakingBudget({
    initialMs: remainingSpeakingTimeMs,
    speaking: engine.phase === 'USER_SPEAKING',
    waiting: engine.phase === 'USER_READY',
  });

  // 중도 이탈 (정상 완료는 서버가 판정한다)
  const leave = () => {
    track(EVENTS.SMALL_TALK_ABANDONED, {
      session_id: session.sessionId,
      partner,
      turn_index: engine.turnIndex,
    });
    engine.abandon(); // 진행 중인 속마음 폴링을 멈춘다
    endSession();
    // 여기까지 주고받은 발화도 시간을 썼다 — 완료했을 때와 똑같이 홈을 다시 받는다
    refreshHome();
  };

  return {
    ...engine,
    leave,
    remainingMs: budget.remainingMs,
    // 이번 발화에서 남은 몫(0~1) — 마이크 둘레의 타이머 링이 그린다
    speakingRatio: budget.ratio,
    // 종료 화면이 보여주는 이 대화의 기록
    summary: {
      speakingDurationMs: progress?.accumulatedSpeakingDurationMs ?? 0,
      exchangeCount,
    },
  };
};
