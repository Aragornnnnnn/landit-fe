// 스몰톡 대화 흐름 훅 — 대화 엔진에 스몰톡 세션·제출 API를 배선하고, 스몰톡에만 있는 두 가지를 맡는다.
// (1) 상대가 작별 인사를 알아채면 정말 끝낼지 묻고 그 답을 서버에 보내 대화를 풀어 준다
// (2) 오늘 남은 발화 시간을 들고 있다가, 말하는 동안 줄이고 제출 후 서버 값으로 정정한다
'use client';

import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useQueryClient } from '@tanstack/react-query';

import type { Partner } from '@/features/conversation/model/character-look';
import { useConversationTurns } from '@/features/conversation/model/useConversationTurns';
import {
  decideSmallTalkExit,
  submitSmallTalkMessage,
  type SmallTalkProgress,
  type SmallTalkSessionStartResponse,
} from '@/features/small-talk/api/small-talk';
import { smallTalkKeys } from '@/features/small-talk/model/keys';
import { findPartner } from '@/features/small-talk/model/partner';
import { track } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';

import { useExitDecision } from './useExitDecision';

// 내가 먼저 걸 때 카드에 뜨는 안내 — 시나리오와 달리 읽을 상황이 없어서 주제부터 열어 준다
const USER_OPENING_INSTRUCTION =
  '오늘 있었던 일이든 요즘 관심사든, 먼저 말을 걸어보세요';

interface SmallTalkFlowOptions {
  session: SmallTalkSessionStartResponse;
  // 홈에서 고른 상대. 목소리도 여기서 나온다 — 서버 ttsVoice는 고른 상대와 무관한 값이라 쓰지 않는다
  // (BE에 characterId 요청 중)
  partner: Partner;
  // 진입 시점의 오늘 남은 발화 시간
  remainingSpeakingTimeMs: number;
  // 중도 이탈 시 세션 정리 — 세션을 만든 쪽(화면)이 소유한다
  endSession: () => void;
}

export const useSmallTalkFlow = ({
  session,
  partner,
  remainingSpeakingTimeMs,
  endSession,
}: SmallTalkFlowOptions) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const exitDecision = useExitDecision();
  const [remainingMs, setRemainingMs] = useState(remainingSpeakingTimeMs);
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

  const engine = useConversationTurns({
    firstSpeaker: session.startMode === 'AI_FIRST' ? 'AI' : 'USER',
    voice: findPartner(partner).voice,
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
        timeLimitReached: remainingMs === 0,
      });

      // 상대가 작별 인사를 알아챈 턴 — 다음 발화도 속마음도 없이 멈춰 있다.
      // 답을 보내야 대화가 풀리므로, 물어보고 기다렸다가 그 결과를 이번 턴의 결과로 삼는다
      if (result.turnStatus === 'EXIT_CONFIRMATION_REQUIRED') {
        const decision = await exitDecision.ask();
        track(EVENTS.SMALL_TALK_EXIT_DECIDED, {
          session_id: session.sessionId,
          partner,
          decision: decision === 'END' ? 'end' : 'continue',
        });
        result = await decideSmallTalkExit(session.sessionId, {
          submittedMessageId: result.submittedMessage.messageId,
          decision,
        });
      }

      setProgress(result.progress);
      setRemainingMs(result.progress.remainingSpeakingTimeMs);
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
        // 오늘 남은 시간이 줄었다 — 홈이 옛 숫자를 먼저 그리지 않게 다시 받아 둔다
        void queryClient.invalidateQueries({
          queryKey: smallTalkKeys.main(userId),
        });
      }

      return {
        submittedMessage: result.submittedMessage,
        nextMessage: result.nextMessage,
        completed,
      };
    },
  });

  // 말하는 동안만 시간이 줄어든다 — 타이핑은 발화가 아니라 예산을 쓰지 않는다.
  // 여기 값은 보여주기용이고, 진짜 정산은 제출 응답(progress)이 한다
  const speaking =
    engine.phase === 'USER_SPEAKING' && !engine.input.keyboardMode;

  // 말하기를 누른 순간의 잔량 — 타이머 링은 이 값을 가득 찬 것으로 잡는다.
  // 하루치를 기준으로 잡으면 남은 게 적은 날엔 말을 시작하기도 전에 링이 비어 있다
  const [speechBudgetMs, setSpeechBudgetMs] = useState<number | null>(null);
  if (speaking && speechBudgetMs === null) setSpeechBudgetMs(remainingMs);
  if (!speaking && speechBudgetMs !== null) setSpeechBudgetMs(null);
  useEffect(() => {
    if (!speaking) return;
    const ticker = setInterval(
      () => setRemainingMs((ms) => Math.max(0, ms - 1000)),
      1000,
    );
    return () => clearInterval(ticker);
  }, [speaking]);

  // 시간이 0이 돼도 하던 말은 끊지 않는다 — 노래방 마지막 곡처럼, 시작한 발화는 끝까지 간다.
  // 서버도 예약 차감이라 초과분을 받아 주고(잔량은 0에서 멈춘다), 그 턱을 작별 인사로 닫는다

  // 중도 이탈 (정상 완료는 서버가 판정한다)
  const leave = () => {
    track(EVENTS.SMALL_TALK_ABANDONED, {
      session_id: session.sessionId,
      partner,
      turn_index: engine.turnIndex,
    });
    engine.abandon(); // 진행 중인 속마음 폴링을 멈춘다
    endSession();
  };

  return {
    ...engine,
    leave,
    remainingMs,
    // 이번 발화에서 남은 몫(0~1) — 타이머 링이 그린다. 말하기 전에는 가득 찬 상태다
    speakingRatio: speechBudgetMs ? remainingMs / speechBudgetMs : 1,
    // 종료 화면이 보여주는 이 대화의 기록
    summary: {
      speakingDurationMs: progress?.accumulatedSpeakingDurationMs ?? 0,
      exchangeCount,
    },
    exitDecision,
  };
};
