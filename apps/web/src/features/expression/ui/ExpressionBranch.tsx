'use client';

// 표현학습 분기 — 대화 완료 축하를 잠깐 보여준 뒤, 표현을 준비한 듯 분석 연출과 준비된
// 표현 리스트를 노출한다. [학습하러 가기]는 첫 표현부터 시작한다.
import { useEffect, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';

// 완료 축하를 이 화면이 띄운다 — 완료 직후를 여는 자리가 여기뿐이라 가로 import를 둔다 (widgets 후보)
import { StreakStamp } from '@/features/streak/ui/StreakStamp';
import { track } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';
import {
  scenarioExpressionPath,
  scenarioReturnPath,
} from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { ArrowRightIcon, CloseIcon } from '@/shared/ui/Icons';

import { useExpressionsQuery } from '../model/useExpressionsQuery';
import { ExpressionList } from './ExpressionList';

// 축하·분석 화면이 같은 타이틀 타이포를 공유해야 전환 순간 글자가 튀지 않는다
const TITLE_CLASS =
  'pt-1 text-3xl leading-[1.22] font-black tracking-normal whitespace-pre-line text-foreground';

// 축하 노출 시간과, 분석 문구를 다 읽을 정도의 시간.
// 축하는 열매가 찍히고 숫자가 선 뒤에도 잠깐 남는다 — 연출이 끝나자마자 걷히면 본 것을 못 읽는다
const CELEBRATE_MS = 2600;
const ANALYZE_MS = 2000;

export const ExpressionBranch = ({
  scenarioId,
  date,
}: {
  scenarioId: number;
  // 어느 날 카드에서 온 대화였는지. 학습으로 들어갈 때도 나올 때도 이어 나른다
  date?: string;
}) => {
  const router = useRouter();
  const nickname = useAuthStore((state) => state.member?.nickname ?? null);
  const { expressions, error, retry } = useExpressionsQuery(scenarioId);

  // 학습 진입 대상 — 아직 안 배운 첫 표현. 없으면 리스트로 보낸다.
  const nextExpressionId = expressions?.find(
    (expression) => !expression.completed && !expression.locked,
  )?.expressionId;

  // 이 화면은 표현 데이터만 있으면 된다 — 시나리오 목록 fetch에 묶지 않아야 그게 느리거나 실패해도 안 멈춘다
  const ready = Boolean(expressions);
  const name = nickname ?? '회원';
  const count = expressions?.length ?? 0;

  // 진입 연출 2단계 — 축하(스트릭 도장) → 분석(랜디) 문구를 읽을 만큼만 → 리빌.
  // 타자기 없이 고정 문구라, 분석은 글을 다 읽을 정도의 시간만 잡아둔다.
  const [step, setStep] = useState<'celebrate' | 'analyze' | 'done'>(
    'celebrate',
  );
  useEffect(() => {
    const toAnalyze = setTimeout(() => setStep('analyze'), CELEBRATE_MS);
    const toDone = setTimeout(() => setStep('done'), CELEBRATE_MS + ANALYZE_MS);
    return () => {
      clearTimeout(toAnalyze);
      clearTimeout(toDone);
    };
  }, []);

  const celebrating = step === 'celebrate';
  // 연출이 끝나고 데이터도 준비돼야 리빌 — ready를 함께 봐야 결과가 먼저 깜빡이지 않는다
  const listed = ready && step === 'done';

  // 연출이 끝나고 표현 리스트가 실제로 드러난 순간을 노출로 기록한다
  useEffect(() => {
    if (!listed) return;
    track(EVENTS.EXPRESSION_LIST_VIEWED, {
      scenario_id: scenarioId,
      expression_count: count,
    });
  }, [listed, scenarioId, count]);

  const goExpression = (expressionId: number) => {
    track(EVENTS.EXPRESSION_SELECTED, {
      expression_id: expressionId,
      scenario_id: scenarioId,
      source: 'post_conversation',
    });
    router.push(scenarioExpressionPath(scenarioId, expressionId, date));
  };

  const goLearn = () =>
    nextExpressionId
      ? goExpression(nextExpressionId)
      : router.replace(scenarioReturnPath({ flip: scenarioId, date }));

  return (
    <main
      className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <header className="relative flex h-14 flex-none items-center px-3">
        <button
          onClick={() => {
            // X가 유일한 이탈 경로다 — 학습 없이 나가는 신호를 여기서 남긴다
            track(EVENTS.EXPRESSION_LEARNING_SKIPPED, {
              scenario_id: scenarioId,
              expression_count: count,
            });
            router.replace(scenarioReturnPath({ date }));
          }}
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
            onClick={() => {
              track(EVENTS.ERROR_RETRIED, { screen: 'expression_list' });
              retry();
            }}
          >
            다시 시도
          </Button>
        </div>
      ) : (
        // 찾는 중엔 좌측 위 타이틀 + 가운데 구슬 랜디 → 찾은 뒤엔 타이틀 대신 결과 문구 + 인라인 리스트
        <div className="flex min-h-0 flex-1 flex-col px-6 pb-[max(env(safe-area-inset-bottom),24px)]">
          <AnimatePresence mode="wait">
            {celebrating ? (
              <CelebrateStage key="celebrate" />
            ) : !listed ? (
              <AnalyzeStage key="analyzing" />
            ) : (
              <RevealStage
                key="reveal"
                count={count}
                name={name}
                expressions={expressions}
                onSelect={goExpression}
                onLearn={goLearn}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </main>
  );
};

// 대화 완료 축하 — 분석 연출과 같은 골격(좌상단 타이틀 + 가운데)으로 그려 전환이 매끄럽다.
// 가운데는 오늘 열매가 찍히는 순간이 채운다 — 완료를 매번 같은 폭죽으로 갚으면 며칠째든 감흥이 없다
const CelebrateStage = () => (
  <motion.div
    className="flex min-h-0 flex-1 flex-col"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, scale: 0.96 }}
    transition={{ duration: 0.25 }}
  >
    <h1 className={TITLE_CLASS}>{'대화 하나를\n잘 완료했어요!'}</h1>
    <StreakStamp />
  </motion.div>
);

// 분석 — 고정 문구 + 가운데 구슬 랜디만 (타이핑 없이 읽을 시간만 준다). 랜디는 톡 튀어 나타나 둥실둥실 떠 있는다
const AnalyzeStage = () => (
  <motion.div
    className="flex min-h-0 flex-1 flex-col"
    exit={{ opacity: 0, scale: 0.94 }}
    transition={{ duration: 0.28 }}
  >
    <h1 className={TITLE_CLASS}>
      {'방금 대화를 바탕으로\n맞춤형 표현 학습을 만들고 있어요'}
    </h1>
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
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
    </div>
  </motion.div>
);

// 리빌 — '만들고 있어요' 타이틀 자리에 결과 문구(개수만 강조)가 서고 리스트가 타타탁 붙는다
const RevealStage = ({
  count,
  name,
  expressions,
  onSelect,
  onLearn,
}: {
  count: number;
  name: string;
  expressions:
    React.ComponentProps<typeof ExpressionList>['expressions'] | null;
  onSelect: (expressionId: number) => void;
  onLearn: () => void;
}) => (
  <motion.div
    className="flex min-h-0 flex-1 flex-col"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
  >
    <p className="pt-1 text-xl leading-snug font-extrabold text-foreground">
      {count > 0 ? (
        <>
          원어민이 될 수 있는 표현 <span className="text-primary">{count}</span>
          개를 찾았어요
        </>
      ) : (
        `${name}님을 위한 표현을 준비했어요`
      )}
    </p>
    <div className="-mx-6 mt-4 min-h-0 flex-1 overflow-y-auto">
      {expressions && (
        <ExpressionList
          expressions={expressions}
          onSelect={onSelect}
          stagger
          hideStartAction
          hideProgress
        />
      )}
    </div>
    <div className="flex flex-none flex-col gap-1 pt-3">
      <Button onClick={onLearn}>
        첫 표현부터 배워볼게요
        <ArrowRightIcon size={16} />
      </Button>
    </div>
  </motion.div>
);
