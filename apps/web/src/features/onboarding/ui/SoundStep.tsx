// 온보딩 2단계 — TTS 소리 확인 (파형 비주얼라이저 + 글자 하이라이트)
'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { Button } from '@/shared/ui/Button';

import { estimateSpeechMs } from '../model/onboarding.constants';
import { useSpeechSimulation } from '../model/useSpeechSimulation';

export const SoundStep = ({ onNext }: { onNext: () => void }) => {
  const { question, isSpeaking, bubbleVisible } = useSpeechSimulation();

  return (
    <>
      <div className="flex flex-1 flex-col pt-7">
        <h1 className="text-3xl leading-[1.18] font-black tracking-normal">
          제가 이렇게 말을 걸게요
          <br />
          소리가 잘 들리나요?
        </h1>

        <div className="flex flex-1 flex-col justify-center gap-6">
          <Waveform isSpeaking={isSpeaking} />
          <QuestionBubble
            question={question}
            isSpeaking={isSpeaking}
            visible={bubbleVisible}
          />
        </div>
      </div>

      <Button onClick={onNext}>잘 들려요!</Button>
    </>
  );
};

// 바마다 고정된 흔들림 시드 — 렌더 중 Math.random은 순수성 위반이라 인덱스 기반으로 만든다
const BAR_SEEDS = Array.from({ length: 28 }, (_, i) => {
  const x = Math.sin(i + 1) * 10000;
  return x - Math.floor(x);
});

// 발화 중 흔들리는 오디오 파형 비주얼라이저
const Waveform = ({ isSpeaking }: { isSpeaking: boolean }) => {
  return (
    <div className="flex h-16 items-center justify-center gap-0.75">
      {BAR_SEEDS.map((seed, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-primary"
          animate={
            isSpeaking
              ? {
                  height: [4 + seed * 8, 14 + seed * 42, 4 + seed * 8],
                  opacity: [0.35, 1, 0.35],
                }
              : { height: 4, opacity: 0.2 }
          }
          transition={
            isSpeaking
              ? {
                  duration: 0.3 + seed * 0.35,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: 'easeInOut',
                  delay: i * 0.03,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
};

// 질문 말풍선 — 발화 진행에 맞춰 글자를 순서대로 하이라이트한다
const QuestionBubble = ({
  question,
  isSpeaking,
  visible,
}: {
  question: string;
  isSpeaking: boolean;
  visible: boolean;
}) => {
  // 진행값이 어느 질문 것인지 함께 저장한다 — 질문이 바뀐 첫 프레임에 이전 값이 새어 나오지 않도록
  const [lit, setLit] = useState({ question, index: -1 });
  const litIndex = isSpeaking && lit.question === question ? lit.index : -1;

  useEffect(() => {
    if (!isSpeaking) return;
    const chars = question.length;
    const duration = estimateSpeechMs(question);
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      setLit({ question, index: Math.floor(t * chars) });
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isSpeaking, question]);

  return (
    // min-h로 말풍선이 사라질 때도 레이아웃을 유지한다
    <div className="flex min-h-30 w-full items-center">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full rounded-[28px] rounded-tl-md bg-secondary px-6 py-7"
          >
            <p className="text-[22px] leading-snug font-bold">
              {question.split('').map((char, i) => (
                <motion.span
                  key={i}
                  animate={{
                    color:
                      i < litIndex ? 'var(--primary)' : 'var(--foreground)',
                  }}
                  transition={{ duration: 0.08 }}
                  style={{
                    display: 'inline-block',
                    whiteSpace: char === ' ' ? 'pre' : undefined,
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
