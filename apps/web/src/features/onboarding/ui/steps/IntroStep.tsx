// 온보딩 1단계 — 인사 + 서비스 핵심 가치 전달
'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { lineBreak } from '@/shared/i18n/rich';
import { Button } from '@/shared/ui/Button';
import { Emoji } from '@/shared/ui/emoji';

export const IntroStep = ({
  nickname,
  onNext,
}: {
  nickname: string | null;
  onNext: () => void;
}) => {
  const t = useTranslations('onboarding.introStep');
  return (
    <>
      <div className="flex flex-1 flex-col pt-7">
        <div className="space-y-5">
          <h1 className="text-3xl leading-[1.3] font-black tracking-normal">
            {t.rich(nickname ? 'namedGreetingTitle' : 'greetingTitle', {
              nickname: nickname ?? '',
              ...lineBreak,
              // 인사말 끝에서 손을 흔든다 — 언어마다 인사말 길이가 달라 문구 안에 자리를 둔다
              wave: () => (
                <motion.span
                  className="inline-block"
                  animate={{ rotate: [0, 20, -10, 20, -5, 0] }}
                  transition={{ delay: 0.5, duration: 1, ease: 'easeInOut' }}
                >
                  <Emoji>👋</Emoji>
                </motion.span>
              ),
            })}
          </h1>

          <p className="text-xl leading-snug font-bold">
            {t.rich('body', lineBreak)}
          </p>
        </div>

        {/* 인사하는 래디를 중앙에 세워 첫인상을 잡는다 — 등장 후엔 좌우로 살랑살랑 움직이며 인사를 잇는다 */}
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <motion.img
              src="/images/character/landy-wave-smile.webp"
              alt={t('mascotLabel')}
              className="object-contain"
              style={{ width: 220, height: 220 }}
              animate={{
                x: [0, -12, 0, 12, 0],
                rotate: [0, -4, 0, 4, 0],
                y: [0, -8, 0, -8, 0],
              }}
              transition={{
                delay: 0.6,
                duration: 3.6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        </div>
      </div>

      <Button onClick={onNext}>{t('nextButton')}</Button>
    </>
  );
};
