'use client';

// AI 발화 재생 훅 — 오프닝은 미리 만든 정적 mp3, 이후엔 TTS 합성, 음성이 없으면 글자 수 타이머로 폴백한다
import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { useTts, type TtsPlayback } from '@/shared/tts/useTts';
import type { TtsVoice } from '@/shared/tts/voice';

import { speechEndPauseMs, speechTypingMs } from './pacing';

/** 지금 소리 나고 있는 발화 — 캐릭터가 이 둘로 입모양을 맞춘다 */
export interface PlayingSpeech {
  playback: TtsPlayback;
  text: string;
}

/** playing은 지금이 AI 발화 단계인지다 — phase가 AI_SPEAKING이고 재생할 발화가 있을 때 참이다 */
interface AiSpeechOptions {
  playing: boolean;
  content: string | null;
  voice: TtsVoice | null;
  // 미리 녹음된 오프닝 오디오 경로 — 없으면(null) 오프닝도 일반 재생 경로를 탄다
  openingSrc: string | null;
  onSpeechEnd: () => void;
}

export const useAiSpeech = ({
  playing,
  content,
  voice,
  openingSrc,
  onSpeechEnd,
}: AiSpeechOptions) => {
  const tts = useTts();
  // 첫 AI 발화(오프닝)인지 — 미리 만든 정적 mp3 재생 대상
  const isOpeningRef = useRef(true);
  // 재생이 시작돼야 알 수 있는 값이라 상태로 둔다 (오프닝 mp3·합성 어느 쪽이든 같다)
  const [speech, setSpeech] = useState<PlayingSpeech | null>(null);

  // 재생이 끝나면(정상이든 폴백이든) onSpeechEnd로 다음 단계를 알린다.
  useEffect(() => {
    if (!playing || content == null) return;

    // 소리가 끝나면 입도 멈춰야 한다 — 남겨두면 마지막 입모양에서 굳는다
    const finish = () => {
      setSpeech(null);
      onSpeechEnd();
    };
    const startLipSync = (playback: TtsPlayback) =>
      setSpeech({ playback, text: content });

    // 이 발화를 시작하고 중단 방법을 돌려준다 — 목소리가 있으면 합성으로 말하고,
    // 없으면 말하는 시간만큼 타이머로 흉내 낸다 (음성 미설정 시나리오도 대화가 멈추지 않게)
    const startSpeaking = (): (() => void) => {
      if (voice) {
        void tts.speak(content, voice, {
          onStart: startLipSync,
          onEnd: finish,
          // 합성 실패는 이 발화를 건너뛰고 다음으로 간다
          onError: () => {
            track(EVENTS.SPEECH_PLAYBACK_FAILED, { source: 'synth' });
            finish();
          },
        });
        return () => tts.stop();
      }
      // 음성이 없으면 입을 맞출 오디오도 없다 — 캐릭터는 음절 흉내로 돌아간다
      const id = setTimeout(finish, speechTypingMs(content) + speechEndPauseMs);
      return () => clearTimeout(id);
    };

    // 오프닝은 미리 녹음된 mp3를 즉시 재생하고, 실패하면 일반 재생으로 폴백한다.
    // 폴백이 재생 수단을 바꾸면 중단 방법도 함께 바뀌어야 해서 재할당 슬롯(let)을 쓴다.
    let stop: () => void;
    // 정리가 끝난 뒤 도착한 실패 콜백이 폴백 재생을 되살리지 않게 막는다 (멈출 주체가 없다)
    let cancelled = false;
    if (isOpeningRef.current && openingSrc) {
      stop = () => tts.stop();
      tts.speakSrc(openingSrc, {
        // 미리 녹음된 오디오도 재생 시각을 읽을 수 있어 입모양이 똑같이 붙는다
        onStart: startLipSync,
        onEnd: finish,
        onError: () => {
          track(EVENTS.SPEECH_PLAYBACK_FAILED, { source: 'opening_mp3' });
          setSpeech(null);
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
      setSpeech(null);
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

  return { markDynamic, prefetch, speech };
};
