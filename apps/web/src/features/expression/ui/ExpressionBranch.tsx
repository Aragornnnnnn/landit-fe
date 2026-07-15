'use client';

// 표현학습 분기 — 대화 피드백 후 표현을 준비한 듯 분석 연출을 보여주고, 준비된 표현 리스트를
// 그대로 노출한다. [학습하러 가기]는 첫 표현부터, [다음 대화하러 가기]는 홈으로 보낸다.
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';

import { useTypewriter } from '@/shared/lib/useTypewriter';
import { useAuthStore } from '@/shared/store/auth-store';
import { Button } from '@/shared/ui/Button';
import { ArrowRightIcon, CloseIcon } from '@/shared/ui/Icons';

import { useExpressions } from '../model/useExpressions';
import { ExpressionList } from './ExpressionList';

export const ExpressionBranch = ({ scenarioId }: { scenarioId: number }) => {
  const router = useRouter();
  const nickname = useAuthStore((state) => state.member?.nickname ?? null);
  const { expressions, error, retry } = useExpressions(scenarioId);

  // 학습 진입 대상 — 아직 안 배운 첫 표현. 없으면 리스트로 보낸다.
  const nextExpressionId = expressions?.find(
    (expression) => !expression.completed && !expression.locked,
  )?.expressionId;

  // 이 화면은 표현 데이터만 있으면 된다 — 시나리오 목록 fetch에 묶지 않아야 그게 느리거나 실패해도 안 멈춘다
  const ready = Boolean(expressions);
  const name = nickname ?? '회원';
  const count = expressions?.length ?? 0;

  // 좌측 위 고정 타이틀 (온보딩 스타일 h1) — "위해"에서 줄바꿈
  const title = `${name}님을 위해\n딱 맞는 영어 표현을 찾고 있어요`;
  // 캐릭터 밑 타자기 — 데이터에 안 묶인 정적 문구라 마운트 즉시 타이핑이 시작된다(개수 N은 리빌 서브타이틀에서).
  const phrases = [
    '대화를 꼼꼼히 분석하고 있어요',
    '원어민이 될 수 있는 표현을 찾았어요',
  ];

  const { text, done } = useTypewriter(phrases);
  // 타이핑이 끝나고 데이터도 준비돼야 리빌 — ready를 함께 봐야 결과가 먼저 깜빡이지 않는다
  const listed = ready && done;
  // 리빌 서브타이틀 — 개수를 담아 결과를 확정한다
  const resultText =
    count > 0
      ? `원어민이 될 수 있는 표현 ${count}개를 찾았어요`
      : `${name}님을 위한 표현을 준비했어요`;

  // 구슬 든 랜디 — 톡 튀어 나타나 둥실둥실 떠 있다가, listed 되면 사라진다
  const orb = (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, y: [0, -8, 0] }}
      transition={{
        scale: { type: 'spring', stiffness: 420, damping: 18 },
        opacity: { duration: 0.25 },
        y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/character/landy-orb.webp"
        alt=""
        className="object-contain"
        style={{ width: 168, height: 168 }}
      />
    </motion.div>
  );

  const goExpression = (expressionId: number) =>
    router.push(`/expressions/${scenarioId}/${expressionId}`);

  const goLearn = () =>
    nextExpressionId
      ? goExpression(nextExpressionId)
      : router.push(`/home?flip=${scenarioId}`);

  return (
    <main
      className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
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
      ) : (
        // 좌측 위 타이틀 고정 + (가운데 구슬 랜디 + 밑 타이핑) → 캐릭터 사라지고 인라인 리스트
        <div className="flex min-h-0 flex-1 flex-col px-6 pb-[max(env(safe-area-inset-bottom),24px)]">
          <h1 className="pt-1 text-3xl leading-[1.22] font-black tracking-normal whitespace-pre-line text-foreground">
            {title}
          </h1>

          <AnimatePresence mode="wait">
            {!listed ? (
              // 가운데 구슬 랜디 + 밑 타이핑
              <motion.div
                key="analyzing"
                className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6"
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.28 }}
              >
                {orb}
                {/* 텍스트 영역은 항상 자리(min-h)를 잡아, 타이핑이 생겨도 캐릭터가 안 밀린다 */}
                <p className="min-h-[4.5rem] text-center text-xl leading-relaxed font-extrabold whitespace-pre-line text-foreground">
                  {text}
                  {!done && (
                    <span className="ml-0.5 inline-block animate-pulse text-primary">
                      |
                    </span>
                  )}
                </p>
              </motion.div>
            ) : (
              // 캐릭터 사라지고, 결과 문구가 서브타이틀로 오르며 리스트가 타타탁 붙는다
              <motion.div
                key="reveal"
                className="flex min-h-0 flex-1 flex-col"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="mt-2 text-lg leading-snug font-extrabold text-primary">
                  {resultText}
                </p>
                <div className="-mx-6 mt-4 min-h-0 flex-1 overflow-y-auto">
                  {expressions && (
                    <ExpressionList
                      expressions={expressions}
                      onSelect={goExpression}
                      stagger
                      hideStartAction
                      hideProgress
                    />
                  )}
                </div>
                <div className="flex flex-none flex-col gap-1 pt-3">
                  <Button onClick={goLearn}>
                    첫 표현부터 배워볼게요
                    <ArrowRightIcon size={16} />
                  </Button>
                  <button
                    type="button"
                    onClick={() => router.push('/home?just=1')}
                    className="flex h-11 w-full items-center justify-center text-sm font-semibold text-muted-foreground transition-colors active:text-foreground"
                  >
                    다음 대화하러 갈게요
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </main>
  );
};
