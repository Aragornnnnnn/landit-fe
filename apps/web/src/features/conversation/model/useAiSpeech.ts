'use client';

// AI 발화 재생 훅 — 오프닝은 미리 만든 정적 mp3, 이후엔 TTS 합성, 음성이 없으면 글자 수 타이머로 폴백한다
import { useEffect, useRef } from 'react';

import { useTts } from '@/shared/tts/useTts';
import type { TtsVoice } from '@/shared/tts/voice';

import { speechEndPauseMs, speechTypingMs } from './pacing';

interface AiSpeechOptions {
  // 지금이 AI 발화 단계인가 (phase가 AI_SPEAKING이고 재생할 발화가 있다)
  playing: boolean;
  content: string | null;
  voice: TtsVoice | null;
  scenarioId: number;
  onSpeechEnd: () => void;
}

export const useAiSpeech = ({
  playing,
  content,
  voice,
  scenarioId,
  onSpeechEnd,
}: AiSpeechOptions) => {
  const tts = useTts();
  // 첫 AI 발화(오프닝)인지 — 미리 만든 정적 mp3 재생 대상
  const isOpeningRef = useRef(true);

  // 재생이 끝나면(정상이든 폴백이든) onSpeechEnd로 다음 단계를 알린다.
  useEffect(() => {
    if (!playing || content == null) return;

    // 이 발화를 시작하고 중단 방법을 돌려준다 — 목소리가 있으면 합성으로 말하고,
    // 없으면 말하는 시간만큼 타이머로 흉내 낸다 (음성 미설정 시나리오도 대화가 멈추지 않게)
    const startSpeaking = (): (() => void) => {
      if (voice) {
        void tts.speak(content, voice, {
          onEnd: onSpeechEnd,
          onError: onSpeechEnd,
        });
        return () => tts.stop();
      }
      const id = setTimeout(
        onSpeechEnd,
        speechTypingMs(content) + speechEndPauseMs,
      );
      return () => clearTimeout(id);
    };

    // 오프닝은 미리 녹음된 mp3를 즉시 재생하고, 실패하면 일반 재생으로 폴백한다.
    // 폴백이 재생 수단을 바꾸면 중단 방법도 함께 바뀌어야 해서 재할당 슬롯(let)을 쓴다.
    let stop: () => void;
    // 정리가 끝난 뒤 도착한 실패 콜백이 폴백 재생을 되살리지 않게 막는다 (멈출 주체가 없다)
    let cancelled = false;
    if (isOpeningRef.current) {
      stop = () => tts.stop();
      tts.speakSrc(`/audio/opening-${scenarioId}.mp3`, {
        onEnd: onSpeechEnd,
        onError: () => {
          if (cancelled) return;
          stop = startSpeaking();
        },
      });
    } else {
      stop = startSpeaking();
    }
    return () => {
      cancelled = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, content]);

  // 이후 발화는 동적 생성 — 정적 mp3 대상이 아니다. 다음 질문이 화면에 올라갈 때 부른다
  const markDynamic = () => {
    isOpeningRef.current = false;
  };

  // 다음 질문을 미리 합성해 재생 지연을 없앤다
  const prefetch = (text: string) => {
    if (voice) void tts.prefetch(text, voice);
  };

  return { markDynamic, prefetch };
};
