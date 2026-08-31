// 표현 설명 화면(ExpressionIntroStep)의 소리 배선 — 첫 진입 자동재생(표현 → 예문)과
// 스피커 토글·카라오케 진행률·듣기 계측을 한곳에서 관리한다
import { useEffect, useRef } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';

import { useAudioPlayer } from './useAudioPlayer';

// 설명 화면 자동재생에서 표현 → 예문 사이 숨 고르는 텀
const INTRO_GAP_MS = 600;

interface UseExpressionIntroStepAudioOptions {
  // 설명 화면이 떠 있는 동안만 소리를 낸다 — 떠나면 자동재생과 예약된 다음 재생을 끊는다
  active: boolean;
  expressionId: number;
  sentenceAudioUrl: string | null;
  // 표현만 읽는 음원 — 없는 표현(패턴형)은 표현 듣기 버튼 자체를 숨긴다
  expressionAudioUrl: string | null;
}

/**
 * 표현 설명 화면의 듣기 배선 훅 — 반환 객체를 ExpressionIntroStep에 그대로 펼쳐 넘긴다.
 * 첫 진입 시 표현 → 예문 순서로 자동 1회 재생하고(사용자가 끄면 다음 재생을 잇지 않는다),
 * 수동 토글은 자동 순차 재생의 대기 타이머를 취소한다.
 */
export const useExpressionIntroStepAudio = ({
  active,
  expressionId,
  sentenceAudioUrl,
  expressionAudioUrl,
}: UseExpressionIntroStepAudioOptions) => {
  const player = useAudioPlayer();
  // 자동재생은 화면 수명당 1회 — 발음 화면에서 되돌아와도 다시 틀지 않는다
  const playedRef = useRef(false);
  const gapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearGap = () => {
    if (gapTimerRef.current) clearTimeout(gapTimerRef.current);
    gapTimerRef.current = null;
  };
  useEffect(() => clearGap, []);

  useEffect(() => {
    if (!active) {
      // 설명 화면을 떠나면 자동재생과 예약된 다음 재생을 끊는다 — 발음 녹음 화면에 소리가 새지 않게
      clearGap();
      player.stop();
      return;
    }
    if (playedRef.current || !sentenceAudioUrl) return;
    playedRef.current = true;
    if (expressionAudioUrl) {
      player.play(expressionAudioUrl, {
        id: 'intro-expression',
        onDone: (reason) => {
          if (reason !== 'ended') return;
          gapTimerRef.current = setTimeout(() => {
            player.play(sentenceAudioUrl, { id: 'intro-sentence' });
          }, INTRO_GAP_MS);
        },
      });
    } else {
      player.play(sentenceAudioUrl, { id: 'intro-sentence' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 진입 시 1회, player는 안정적이지 않아 제외
  }, [active, sentenceAudioUrl, expressionAudioUrl]);

  // 재생 시작만 찍는다 — 같은 id가 나오는 중이면 그 토글은 끄기다
  const trackPlayed = (id: string, source: 'expression' | 'sentence') => {
    if (player.playingId === id) return;
    track(EVENTS.PRONUNCIATION_AUDIO_PLAYED, {
      expression_id: expressionId,
      source,
    });
  };

  return {
    onPlayExpressionAudio: expressionAudioUrl
      ? () => {
          clearGap();
          trackPlayed('intro-expression', 'expression');
          player.toggle(expressionAudioUrl, { id: 'intro-expression' });
        }
      : undefined,
    playingExpressionAudio: player.playingId === 'intro-expression',
    expressionAudioProgress:
      player.playingId === 'intro-expression' ? player.progress : 0,
    onPlaySentenceAudio: () => {
      if (!sentenceAudioUrl) return;
      clearGap();
      trackPlayed('intro-sentence', 'sentence');
      player.toggle(sentenceAudioUrl, { id: 'intro-sentence' });
    },
    playingSentenceAudio: player.playingId === 'intro-sentence',
    sentenceAudioProgress:
      player.playingId === 'intro-sentence' ? player.progress : 0,
  };
};
