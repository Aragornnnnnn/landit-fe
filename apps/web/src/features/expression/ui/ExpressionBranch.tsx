'use client';

// 표현학습 분기 — 대화 피드백 후 표현을 준비한 듯 분석 연출을 보여주고, 준비된 표현 리스트를
// 그대로 노출한다. [학습하러 가기]는 첫 표현부터, [다음 대화하러 가기]는 홈으로 보낸다.
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';

import { useScenarios } from '@/features/scenario/model/useScenarios';
import { useTypewriter } from '@/shared/lib/useTypewriter';
import { useAuthStore } from '@/shared/store/auth-store';
import { Button } from '@/shared/ui/Button';
import { CharacterSlot } from '@/shared/ui/CharacterSlot';
import { ArrowRightIcon, CloseIcon } from '@/shared/ui/Icons';

import { useExpressions } from '../model/useExpressions';
import { ExpressionList } from './ExpressionList';

export const ExpressionBranch = ({ scenarioId }: { scenarioId: number }) => {
  const router = useRouter();
  const nickname = useAuthStore((state) => state.member?.nickname ?? null);
  const { categories } = useScenarios();
  const { expressions, error, retry } = useExpressions(scenarioId);

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

  const goExpression = (expressionId: number) =>
    router.push(`/expressions/${scenarioId}/${expressionId}`);

  const goLearn = () =>
    nextExpressionId
      ? goExpression(nextExpressionId)
      : router.push(`/home?flip=${scenarioId}`);

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <header className="relative flex h-14 flex-none items-center px-3">
        <button
          onClick={() => router.push(`/home?card=${scenarioId}`)}
          className="flex size-10 items-center justify-center text-muted-foreground"
          aria-label="닫기"
        >
          <CloseIcon size={22} />
        </button>
      </header>

      {error && !expressions ? (
        // 표현을 못 불러오면 무한 로딩 대신 원인을 보이고 다시 시도하게 한다
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-muted-foreground">
            {error.message || '표현을 불러오지 못했어요.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="w-auto px-6"
            onClick={retry}
          >
            다시 시도
          </Button>
        </div>
      ) : !ready ? (
        // 표현을 불러오는 중 — 빈 스피너 대신 캐릭터가 준비하는 연출로 보여준다
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 px-6">
          <div className="relative">
            <CharacterSlot size={104} />
            <span className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full bg-primary text-sm">
              <span className="tossface">✨</span>
            </span>
          </div>
          <p className="text-center text-xl leading-relaxed font-extrabold text-foreground">
            대화를 바탕으로 표현을 준비하고 있어요
          </p>
        </div>
      ) : !done ? (
        // 분석 연출 — 준비가 끝나기 전까지 캐릭터가 표현을 준비하는 듯 보여준다
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 px-6">
          <div className="relative">
            <CharacterSlot size={104} />
            <span className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full bg-primary text-sm">
              <span className="tossface">✨</span>
            </span>
          </div>
          <p className="min-h-[4.5rem] text-center text-xl leading-relaxed font-extrabold whitespace-pre-line text-foreground">
            {text}
            <span className="ml-0.5 inline-block animate-pulse text-primary">
              |
            </span>
          </p>
        </div>
      ) : (
        // 준비 완료 — 방금 만든 듯 표현 리스트를 스르륵 노출하고, 첫 표현부터 학습하게 한다
        <motion.div
          className="flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="px-5 pt-1 pb-3 text-center text-lg leading-snug font-extrabold whitespace-pre-line text-foreground">
            {text}
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {expressions && (
              <ExpressionList
                expressions={expressions}
                onSelect={goExpression}
              />
            )}
          </div>
          <div className="flex flex-none flex-col gap-2 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),24px)]">
            <Button onClick={goLearn}>
              첫 표현부터 학습하러 가기
              <ArrowRightIcon size={16} />
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => router.push('/home?just=1')}
            >
              다음 대화하러 갈게요
            </Button>
          </div>
        </motion.div>
      )}
    </main>
  );
};
