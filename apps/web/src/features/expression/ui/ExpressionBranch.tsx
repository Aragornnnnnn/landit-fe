'use client';

// 표현학습 분기 — 대화 완료 축하를 잠깐 보여준 뒤, 표현을 준비한 듯 분석 연출과 준비된
// 표현 리스트를 노출한다. [학습하러 가기]는 첫 표현부터 시작한다.
import { useEffect, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

import { track } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';
import {
  scenarioExpressionPath,
  scenarioReturnPath,
} from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { CloseIcon } from '@/shared/ui/Icons';

import { useExpressionsQuery } from '../model/useExpressionsQuery';
import { AnalyzeStage, CelebrateStage, RevealStage } from './ExpressionStages';

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
