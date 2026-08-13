'use client';

// 스몰톡 대화 직후 — 축하를 잠깐 보여준 뒤, 서버가 표현을 다 만들 때까지 기다렸다가 리스트를 편다.
// 시나리오는 표현이 콘텐츠에 이미 있어 연출 시간만 채우면 되지만, 스몰톡 표현은 그 대화에서 그때 만들어진다
import { useEffect, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

import type { Expression } from '@/features/expression/api/list';
import {
  AnalyzeStage,
  CelebrateStage,
  RevealStage,
} from '@/features/expression/ui/ExpressionStages';
import type { SmallTalkSessionExpression } from '@/features/small-talk/api/small-talk';
import { useSmallTalkSessionQuery } from '@/features/small-talk/model/useSmallTalkSessionQuery';
import { track } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';
import { sessionExpressionPath, SMALLTALK_PATH } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { CloseIcon } from '@/shared/ui/Icons';

// 축하가 머무는 시간 — 열매가 찍히고 숫자가 선 뒤에도 잠깐 남는다.
// 연출이 끝나자마자 걷히면 본 것을 못 읽는다 (시나리오와 같은 값)
const CELEBRATE_MS = 2600;

// 서버는 잠금을 내려주지 않는다 — 아직 안 배운 것 중 첫 표현만 열고 나머지는 잠근다.
// 이미 배운 표현은 다시 볼 수 있게 열어 둔다
const toListItems = (
  expressions: SmallTalkSessionExpression[],
): Expression[] => {
  const next = expressions.find((expression) => !expression.completed);
  return expressions.map((expression) => ({
    ...expression,
    locked:
      !expression.completed && expression.expressionId !== next?.expressionId,
  }));
};

interface SmallTalkResultProps {
  sessionId: number;
  // 대화를 막 끝내고 온 길인가 — 표현 학습에서 돌아온 길이면 축하를 다시 하지 않는다
  celebrating: boolean;
}

export const SmallTalkResult = ({
  sessionId,
  celebrating: celebrateOnArrival,
}: SmallTalkResultProps) => {
  const router = useRouter();
  const nickname = useAuthStore((state) => state.member?.nickname ?? null);
  const { session, error, generationStuck } =
    useSmallTalkSessionQuery(sessionId);

  // 축하는 시간이 정하고, 그 뒤는 표현이 준비됐는지가 정한다
  const [celebrating, setCelebrating] = useState(celebrateOnArrival);
  useEffect(() => {
    if (!celebrateOnArrival) return;
    const timer = setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    return () => clearTimeout(timer);
  }, [celebrateOnArrival]);

  // 준비가 끝났는데 표현이 하나도 없을 수 있다 — 리스트를 펴 봐야 보여줄 것도 배울 것도 없다
  const ready = session?.expressionGenerationStatus === 'READY';
  const expressions =
    ready && session.expressions.length > 0
      ? toListItems(session.expressions)
      : null;
  const nothingToLearn = ready && session.expressions.length === 0;

  // 축하가 끝나고 표현 리스트가 실제로 드러난 순간을 노출로 기록한다
  const listed = !celebrating && expressions !== null;
  const count = expressions?.length ?? 0;
  useEffect(() => {
    if (!listed) return;
    track(EVENTS.EXPRESSION_LIST_VIEWED, {
      session_id: sessionId,
      expression_count: count,
    });
  }, [listed, sessionId, count]);

  const goHome = () => router.replace(SMALLTALK_PATH);

  // X가 유일한 이탈 경로다 — 학습 없이 나가는 신호를 여기서 남긴다
  const close = () => {
    track(EVENTS.EXPRESSION_LEARNING_SKIPPED, {
      session_id: sessionId,
      expression_count: count,
    });
    goHome();
  };
  const goLearn = (expressionId: number) => {
    track(EVENTS.EXPRESSION_SELECTED, {
      expression_id: expressionId,
      session_id: sessionId,
      source: 'post_conversation',
    });
    router.push(sessionExpressionPath(sessionId, expressionId));
  };

  return (
    <main
      className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <header className="relative flex h-14 flex-none items-center px-3">
        <button
          onClick={close}
          className="flex size-10 items-center justify-center text-muted-foreground"
          aria-label="닫기"
        >
          <CloseIcon size={22} />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-[max(env(safe-area-inset-bottom),24px)]">
        <AnimatePresence mode="wait">
          {celebrating ? (
            <CelebrateStage key="celebrate" />
          ) : error ? (
            // 조회가 막히면 만드는 중 화면에 갇힌다 — 표현이 없는 이유를 말하고 내보낸다
            <ClosingStage
              key="error"
              title={'표현을 불러오지 못했어요'}
              description={'잠시 후 기록에서 다시 열어볼 수 있어요.'}
              onClose={goHome}
            />
          ) : generationStuck || nothingToLearn ? (
            <ClosingStage
              key="stuck"
              title={'표현은 조금 뒤에\n만들어 둘게요'}
              description={
                '지금은 만들기가 오래 걸리고 있어요.\n다 되면 기록에서 볼 수 있어요.'
              }
              onClose={goHome}
            />
          ) : !expressions ? (
            <AnalyzeStage key="analyzing" />
          ) : (
            <RevealStage
              key="reveal"
              count={expressions.length}
              name={nickname ?? '회원'}
              expressions={expressions}
              onSelect={goLearn}
              onLearn={() => goLearn(expressions[0].expressionId)}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

// 표현 없이 화면을 닫는 자리 — 못 만들었거나 못 불러왔을 때. 기다리는 화면에 가두지 않는다
const ClosingStage = ({
  title,
  description,
  onClose,
}: {
  title: string;
  description: string;
  onClose: () => void;
}) => (
  <div className="flex min-h-0 flex-1 flex-col">
    <h1 className="pt-1 text-3xl leading-[1.22] font-black whitespace-pre-line text-foreground">
      {title}
    </h1>
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
      <p className="text-center text-sm leading-6 break-keep whitespace-pre-line text-muted-foreground">
        {description}
      </p>
    </div>
    <Button onClick={onClose}>돌아가기</Button>
  </div>
);
