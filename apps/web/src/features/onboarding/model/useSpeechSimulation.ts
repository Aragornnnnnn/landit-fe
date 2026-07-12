// 사운드 스텝의 발화 시뮬레이션 — TTS 연동 전까지 타이머로 질문 로테이션과 발화 상태를 흉내 낸다
// TODO: TTS 연동 시 타이머를 실제 재생·onEnd 콜백으로 교체 (estimateSpeechMs 사용처도 함께)
'use client';

import { useEffect, useRef, useState } from 'react';

import {
  estimateSpeechMs,
  FALLBACK_QUESTION,
  SOUND_QUESTIONS,
} from './onboarding.constants';

export const useSpeechSimulation = () => {
  const [question, setQuestion] = useState(FALLBACK_QUESTION);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const lastIndexRef = useRef(0);

  // 마운트 후 말풍선을 띄우고 질문 하나를 "발화", 끝나면 다음 질문으로 순환한다
  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, ms: number) => {
      timers.push(
        setTimeout(() => {
          if (!cancelled) fn();
        }, ms),
      );
    };

    const speakQuestion = (next: string) => {
      setIsSpeaking(true);
      schedule(() => {
        setIsSpeaking(false);
        schedule(rotateQuestion, 1400);
      }, estimateSpeechMs(next));
    };

    const rotateQuestion = () => {
      setBubbleVisible(false);
      schedule(() => {
        let idx = lastIndexRef.current;
        do {
          idx = Math.floor(Math.random() * SOUND_QUESTIONS.length);
        } while (idx === lastIndexRef.current && SOUND_QUESTIONS.length > 1);
        lastIndexRef.current = idx;

        const next = SOUND_QUESTIONS[idx];
        setQuestion(next);
        setBubbleVisible(true);
        schedule(() => speakQuestion(next), 400);
      }, 300);
    };

    schedule(() => {
      setBubbleVisible(true);
      schedule(() => speakQuestion(FALLBACK_QUESTION), 400);
    }, 600);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return { question, isSpeaking, bubbleVisible };
};
