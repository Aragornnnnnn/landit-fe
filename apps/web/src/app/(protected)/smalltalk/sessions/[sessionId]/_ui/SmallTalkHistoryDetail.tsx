'use client';

// 지난 스몰톡 한 건 — 그때 만든 표현을 다시 배우러 들어오는 자리.
// 대화 직후 결과 화면과 같은 응답을 쓰지만 연출은 없다. 여기선 얼마나 배웠는지와 남은 표현이 중심이다
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { ExpressionList } from '@/features/expression/ui/ExpressionList';
import { toExpressionListItems } from '@/features/small-talk/lib/session-expressions';
import {
  toDayLabel,
  toSessionTitle,
} from '@/features/small-talk/lib/session-summary';
import { toSpeakingTimeLabel } from '@/features/small-talk/lib/speaking-time';
import { useSmallTalkSessionQuery } from '@/features/small-talk/model/useSmallTalkSessionQuery';
import { track } from '@/shared/analytics';
import {
  sessionExpressionPath,
  SMALLTALK_HISTORY_PATH,
  smallTalkTranscriptPath,
} from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { ChatHistoryIcon, ChevronLeftIcon } from '@/shared/ui/Icons';

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
        {/* 그날 나눈 말은 세로 공간을 먹지 않게 헤더에 둔다 — 표현 다섯 개가 스크롤 없이 서야 한다 */}
        {session && session.messages.length > 0 && (
          <button
            onClick={() => router.push(smallTalkTranscriptPath(sessionId))}
            className="absolute right-3 flex size-10 items-center justify-center text-foreground active:opacity-60"
            aria-label="대화 다시 보기"
          >
            <ChatHistoryIcon size={22} />
          </button>
        )}
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
        <div className="min-h-0 flex-1 overflow-y-auto pb-6">
          {/* 언제 얼마나 얘기했는지 — 표현보다 먼저 읽히는 맥락이다.
              대화 종료 화면의 통계 카드와 같은 언어로 맞춘다 (라벨 위, 값 아래) */}
          {session && (
            <div className="px-5 pt-1 pb-4">
              <div className="flex items-center rounded-2xl bg-card px-5 py-3.5 shadow-sm">
                <Stat
                  label="대화한 날"
                  value={toDayLabel(session.completedAt)}
                />
                <Divider />
                <Stat
                  label="말한 시간"
                  value={toSpeakingTimeLabel(session.userSpeakingDurationMs)}
                />
                <Divider />
                <Stat
                  label="주고받은 말"
                  value={`${session.messages.length}번`}
                />
              </div>
            </div>
          )}

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

// 통계 한 칸 — 라벨은 작게 위, 값은 굵게 아래 (대화 종료 화면과 같은 모양)
const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0 flex-1 text-center">
    <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
    <p className="mt-1 truncate text-[15px] font-extrabold text-foreground">
      {value}
    </p>
  </div>
);

const Divider = () => <div className="h-8 w-px shrink-0 bg-border" />;
