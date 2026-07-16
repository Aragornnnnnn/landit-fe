// 사운드 스텝 재생 — 미리 합성한 정적 mp3를 딜레이 없이 재생하며 5개 문구를 순환한다.
// 파형(isSpeaking)과 글자 하이라이트(progress)를 실제 오디오 진행에 맞춘다. mp3 로드 실패 시 추정 타이머로 폴백.
'use client';

import { useEffect, useState } from 'react';

import {
  estimateSpeechMs,
  pickNextIndex,
  SOUND_QUESTIONS,
  soundAudioSrc,
} from './onboarding.constants';

// 발화 후 다음 문구로 넘어가기 전 여백
const HOLD_MS = 1400;
// 말풍선을 내렸다가 다시 올리는 사이 텀
const SWAP_OUT_MS = 300;
const SWAP_IN_MS = 400;

export const useSoundPlayback = () => {
  const [index, setIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let current = 0; // 렌더 state와 별개로 로테이션이 참조하는 현재 인덱스
    const timers: ReturnType<typeof setTimeout>[] = [];
    let audio: HTMLAudioElement | null = null;
    let raf = 0;

    const schedule = (fn: () => void, ms: number) => {
      timers.push(
        setTimeout(() => {
          if (!cancelled) fn();
        }, ms),
      );
    };

    const stopRaf = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    // 실제 오디오 진행률로 하이라이트를 굴린다
    const trackAudio = (el: HTMLAudioElement) => {
      const tick = () => {
        if (cancelled) return;
        const total = el.duration;
        if (total > 0) setProgress(Math.min(el.currentTime / total, 1));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    // mp3가 없을 때(404 등) 추정 시간으로 하이라이트·발화를 흉내 내 로테이션을 이어간다
    const fallbackSpeak = (text: string) => {
      const duration = estimateSpeechMs(text);
      const start = Date.now();
      const tick = () => {
        if (cancelled) return;
        const t = Math.min((Date.now() - start) / duration, 1);
        setProgress(t);
        if (t < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          setIsSpeaking(false);
          schedule(rotate, HOLD_MS);
        }
      };
      raf = requestAnimationFrame(tick);
    };

    const speak = (i: number) => {
      setIsSpeaking(true);
      setProgress(0);
      stopRaf();

      const el = new Audio(soundAudioSrc(i));
      audio = el;
      el.onended = () => {
        if (cancelled) return;
        stopRaf();
        setProgress(1);
        setIsSpeaking(false);
        schedule(rotate, HOLD_MS);
      };
      el.play().then(
        () => {
          if (!cancelled) trackAudio(el);
        },
        (error) => {
          // stop()으로 인한 AbortError는 폴백 대상이 아니다
          if (error instanceof DOMException && error.name === 'AbortError')
            return;
          if (!cancelled) fallbackSpeak(SOUND_QUESTIONS[i]);
        },
      );
    };

    const rotate = () => {
      setBubbleVisible(false);
      schedule(() => {
        current = pickNextIndex(current, SOUND_QUESTIONS.length);
        setIndex(current);
        setProgress(0);
        setBubbleVisible(true);
        schedule(() => speak(current), SWAP_IN_MS);
      }, SWAP_OUT_MS);
    };

    // 마운트 직후 첫 문구(0번)를 띄우고 재생한다
    schedule(() => {
      setBubbleVisible(true);
      schedule(() => speak(0), SWAP_IN_MS);
    }, 400);

    return () => {
      cancelled = true;
      stopRaf();
      timers.forEach(clearTimeout);
      audio?.pause();
    };
  }, []);

  return {
    question: SOUND_QUESTIONS[index],
    isSpeaking,
    bubbleVisible,
    progress,
  };
};
