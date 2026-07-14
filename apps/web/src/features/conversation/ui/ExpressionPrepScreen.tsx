// 표현 준비 화면 — 대화 종료 후 Sona가 대화를 분석해 표현을 준비한 듯 타이핑 연출한다
// TODO: 표현학습 연결은 후속 이슈 — 연결 전까지 CTA는 홈으로 보낸다
'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';

import type { Scenario } from '@/features/scenario/api/list';
import { useTypewriter } from '@/shared/lib/useTypewriter';
import { useAuthStore } from '@/shared/store/auth-store';
import { Button } from '@/shared/ui/Button';
import { ArrowRightIcon, CloseIcon } from '@/shared/ui/Icons';

import { TypingCursor } from './TypingCursor';

export const ExpressionPrepScreen = ({ scenario }: { scenario: Scenario }) => {
  const router = useRouter();
  const nickname = useAuthStore((state) => state.member?.nickname ?? null);
  const name = nickname ?? '회원';

  // 마지막 문구는 지워지지 않고 남는다(타자기 규칙). 앞 문구들이 "분석 중" 연출을 만든다.
  const phrases = [
    `'${scenario.scenarioTitle}' 대화를 분석하고 있어요`,
    '자주 쓴 표현을 살펴보는 중이에요',
    `${name}님이 더 원어민처럼\n말할 수 있는 표현을 준비했어요`,
  ];
  const { text, done } = useTypewriter(phrases);

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <header
        className="flex flex-none items-center px-3 pb-1"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}
      >
        <button
          onClick={() => router.push('/home')}
          className="flex size-10 items-center justify-center text-foreground transition-transform active:scale-90"
          aria-label="닫기"
        >
          <CloseIcon size={24} />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center px-6 pb-[max(env(safe-area-inset-bottom),24px)]">
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          {/* Sona가 표현을 준비하는 중 — 완료 전까지 둥실둥실 */}
          <motion.div
            animate={done ? { y: 0 } : { y: [0, -8, 0] }}
            transition={
              done
                ? { duration: 0.3 }
                : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/character/sona-good.webp"
              alt="Sona"
              className="object-contain"
              style={{ width: 120, height: 120 }}
            />
          </motion.div>

          {/* 타자기 헤드라인 — 완료 전까지 커서가 깜빡인다 */}
          <p className="min-h-[4.5rem] text-center text-xl leading-relaxed font-extrabold whitespace-pre-line text-foreground">
            {text}
            {!done && <TypingCursor />}
          </p>
        </div>

        {/* 준비 완료 후 CTA 노출 */}
        <motion.div
          className="flex w-full flex-col gap-2"
          initial={false}
          animate={{ opacity: done ? 1 : 0, y: done ? 0 : 12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{ pointerEvents: done ? 'auto' : 'none' }}
        >
          <Button onClick={() => router.push('/home')}>
            원어민 표현 배우러 갈게요
            <ArrowRightIcon size={16} />
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => router.push('/home')}
          >
            다음 대화하러 갈게요
          </Button>
        </motion.div>
      </div>
    </main>
  );
};
