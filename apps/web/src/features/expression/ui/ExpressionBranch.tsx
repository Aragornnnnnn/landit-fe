'use client';

// 표현학습 분기 페이지 — 대화 피드백 후, 실제 시나리오·표현 데이터로 AI가 표현을 준비한 듯 타이핑 연출하고
// [원어민 표현 배우러 갈게요] / [다음 대화하러 갈게요]로 분기시킨다
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';

import { useScenarios } from '@/features/scenario/model/useScenarios';
import { useTypewriter } from '@/shared/lib/useTypewriter';
import { useAuthStore } from '@/shared/store/auth-store';
import { Button } from '@/shared/ui/Button';
import { CharacterSlot } from '@/shared/ui/CharacterSlot';
import { ArrowRightIcon, CloseIcon } from '@/shared/ui/Icons';

import { useExpressions } from '../model/useExpressions';

export const ExpressionBranch = ({ scenarioId }: { scenarioId: number }) => {
  const router = useRouter();
  const nickname = useAuthStore((state) => state.member?.nickname ?? null);
  const { categories } = useScenarios();
  const { expressions } = useExpressions(scenarioId);

  const scenario = categories
    ?.flatMap((category) => category.scenarios)
    .find((item) => item.scenarioId === scenarioId);

  // 학습 진입 대상 — 아직 안 배운 첫 표현. 없으면 리스트로 보낸다.
  const nextExpressionId = expressions?.find(
    (expression) => !expression.completed && !expression.locked,
  )?.expressionId;

  const ready = Boolean(scenario && expressions);
  const name = nickname ?? '회원';
  const count = expressions?.length ?? 0;

  // 마지막 문구는 지워지지 않고 남는다(타자기 규칙). 앞 두 문구가 실제 데이터를 근거로 "분석 중" 연출을 만든다.
  const phrases = ready
    ? [
        `'${scenario?.scenarioTitle}' 대화를 분석하고 있어요`,
        '자주 쓴 표현을 살펴보는 중이에요',
        count > 0
          ? `${name}님이 더 원어민처럼\n말할 수 있는 표현 ${count}개를 준비했어요`
          : `${name}님을 위한 표현을 준비했어요`,
      ]
    : [];

  const { text, done } = useTypewriter(phrases);

  const goLearn = () =>
    router.push(
      nextExpressionId
        ? `/expressions/${scenarioId}/${nextExpressionId}`
        : `/expressions/${scenarioId}`,
    );

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <header className="relative flex h-14 flex-none items-center px-3">
        <button
          onClick={() => router.push('/home')}
          className="flex size-10 items-center justify-center text-muted-foreground"
          aria-label="닫기"
        >
          <CloseIcon size={22} />
        </button>
      </header>

      {!ready ? (
        <div className="flex flex-1 items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center px-6 pb-[max(env(safe-area-inset-bottom),24px)]">
          <div className="flex flex-1 flex-col items-center justify-center gap-8">
            <div className="relative">
              <CharacterSlot size={104} />
              {!done && (
                <span className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full bg-primary text-sm">
                  <span className="tossface">✨</span>
                </span>
              )}
            </div>

            {/* 타자기 헤드라인 — 완료 전까지 커서가 깜빡인다 */}
            <p className="min-h-[4.5rem] text-center text-xl leading-relaxed font-extrabold whitespace-pre-line text-foreground">
              {text}
              {!done && (
                <span className="ml-0.5 inline-block animate-pulse text-primary">
                  |
                </span>
              )}
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
            <Button onClick={goLearn}>
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
      )}
    </main>
  );
};
