'use client';

// 지난 스몰톡 한 건 — 그때 만든 표현을 다시 배우러 들어오는 자리.
// 대화 직후 결과 화면과 같은 응답을 쓰지만 연출은 없다. 여기선 얼마나 배웠는지와 남은 표현이 중심이다
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { ExpressionList } from '@/features/expression/ui/ExpressionList';
import { toExpressionListItems } from '@/features/small-talk/lib/session-expressions';
import { toSessionTitle } from '@/features/small-talk/lib/session-summary';
import { useSmallTalkSessionQuery } from '@/features/small-talk/model/useSmallTalkSessionQuery';
import { track } from '@/shared/analytics';
import {
  sessionExpressionPath,
  SMALLTALK_HISTORY_PATH,
} from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { ChevronLeftIcon } from '@/shared/ui/Icons';

export const SmallTalkHistoryDetail = ({
  sessionId,
}: {
  sessionId: number;
}) => {
  const router = useRouter();
  const { session, error, generationStuck, retry, regenerate } =
    useSmallTalkSessionQuery(sessionId);

  const expressions = session
    ? toExpressionListItems(session.expressions)
    : null;

  const goExpression = (expressionId: number) => {
    track(EVENTS.EXPRESSION_SELECTED, {
      expression_id: expressionId,
      session_id: sessionId,
      source: 'history',
    });
    router.push(sessionExpressionPath(sessionId, expressionId));
  };

  return (
    <main
      className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <header className="relative flex h-14 flex-none items-center justify-center">
        <button
          onClick={() => router.replace(SMALLTALK_HISTORY_PATH)}
          className="absolute left-3 flex size-10 items-center justify-center text-foreground"
          aria-label="뒤로"
        >
          <ChevronLeftIcon size={24} />
        </button>
        <h1 className="truncate px-14 text-[17px] font-bold text-foreground">
          {session ? toSessionTitle(session.title, session.completedAt) : ''}
        </h1>
      </header>

      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-muted-foreground">
            {error.message || '대화를 불러오지 못했어요.'}
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
        <div className="min-h-0 flex-1 overflow-y-auto pt-4 pb-6">
          {/* 표현은 대화가 끝난 뒤 서버가 만든다 — 아직이면 리스트에 셀 것이 없다 */}
          {expressions && expressions.length > 0 ? (
            <ExpressionList expressions={expressions} onSelect={goExpression} />
          ) : (
            session &&
            (generationStuck ? (
              <div className="flex flex-col items-center gap-4 px-8 pt-10 text-center">
                <p className="text-sm leading-6 break-keep whitespace-pre-line text-muted-foreground">
                  {'표현을 만들지 못했어요.\n다시 만들어 볼까요?'}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-auto px-6"
                  onClick={() => void regenerate()}
                >
                  다시 만들기
                </Button>
              </div>
            ) : (
              <p className="px-8 pt-10 text-center text-sm break-keep whitespace-pre-line text-muted-foreground">
                {
                  '이 대화의 표현은 아직 만들어지는 중이에요.\n잠시 후 다시 열어봐 주세요.'
                }
              </p>
            ))
          )}
        </div>
      )}
    </main>
  );
};
