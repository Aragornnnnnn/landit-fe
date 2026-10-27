// 온보딩 2단계 — TTS 소리 확인 (미리 합성한 정적 mp3 재생 + 파형 비주얼라이저 + 글자 하이라이트)
'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { lineBreak } from '@/shared/i18n/rich';
import { Button } from '@/shared/ui/Button';

import { useSoundPlayback } from '../../model/useSoundPlayback';

export const SoundStep = ({ onNext }: { onNext: () => void }) => {
  const t = useTranslations('onboarding.soundStep');
  const { question, isSpeaking, bubbleVisible, progress } = useSoundPlayback();

  return (
    <>
      <div className="flex flex-1 flex-col pt-7">
        <h1 className="text-3xl leading-[1.18] font-black tracking-normal">
          {t.rich('title', lineBreak)}
        </h1>

        <div className="flex flex-1 flex-col justify-center gap-6">
          <Waveform isSpeaking={isSpeaking} />
          <QuestionBubble
            question={question}
            progress={progress}
            visible={bubbleVisible}
          />
        </div>
      </div>

      <Button onClick={onNext}>{t('nextButton')}</Button>
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

// 문장을 낱말(뒤 공백 포함)로 나누고 각 낱말이 문장 몇 번째 글자에서 시작하는지 함께 준다 — 하이라이트는 문장 전체 글자 순서로 센다
const toWords = (sentence: string) => {
  let start = 0;
  return (sentence.match(/\S+\s*|\s+/g) ?? []).map((text) => {
    const word = { text, start };
    start += text.length;
    return word;
  });
};

// 질문 말풍선 — 재생 진행률(progress)에 맞춰 글자를 순서대로 하이라이트한다
const QuestionBubble = ({
  question,
  progress,
  visible,
}: {
  question: string;
  progress: number;
  visible: boolean;
}) => {
  const litIndex = Math.floor(progress * question.length);

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
            {/* 글자를 하나씩 칠하되 낱말은 묶어 둔다 — 글자마다 inline-block이라 묶지 않으면 alrig/ht처럼 낱말 중간에서 줄이 넘어간다 */}
            <p className="text-22 leading-snug font-bold">
              {toWords(question).map(({ text, start }) => (
                <span key={start} className="inline-block whitespace-nowrap">
                  {text.split('').map((char, offset) => {
                    const i = start + offset;
                    return (
                      <motion.span
                        key={i}
                        animate={{
                          color:
                            i < litIndex
                              ? 'var(--primary)'
                              : 'var(--foreground)',
                        }}
                        transition={{ duration: 0.08 }}
                        style={{
                          display: 'inline-block',
                          whiteSpace: char === ' ' ? 'pre' : undefined,
                        }}
                      >
                        {char}
                      </motion.span>
                    );
                  })}
                </span>
              ))}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
