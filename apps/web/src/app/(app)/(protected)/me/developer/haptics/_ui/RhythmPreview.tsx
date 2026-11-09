'use client';

// 리듬 미리보기 — 리듬을 실제로 쓰는 화면을 가짜 값으로 그대로 띄운다. 진동은 그 화면이 스스로 울린다
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { ReviewQuestion } from '@/features/review/api/review';
import { ReviewComplete } from '@/features/review/ui/ReviewComplete';
import { CoinShower } from '@/features/reward/ui/common/CoinShower';
import { streakKeys } from '@/features/streak/model/keys';
import { StreakStamp } from '@/features/streak/ui/StreakStamp';
import { useCurrentUserId } from '@/shared/auth/current-member';
import { useBackPress } from '@/shared/bridge/useBackPress';
import type { HapticRhythm } from '@/shared/haptics';
import { readSeoulDateParts } from '@/shared/lib/seoul-date';

// 실제 계정의 캐시를 건드리지 않게 따로 쓰는 캐시 — 심어 둔 가짜 값을 서버에서 다시 받아 덮지 않는다
const createSandbox = (userId: number | null) => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  // 스트릭 날짜는 서울 기준이다 — UTC로 자르면 아침 9시 전엔 어제가 된다
  const { year, month, day } =
    readSeoulDateParts(new Date().toISOString(), {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }) ?? {};
  const today = `${year}-${month}-${day}`;
  // 어제까지 4일을 이었고 방금 오늘 대화를 끝냈다 — 도장이 찍히는 날
  client.setQueryData(streakKeys.current(userId), {
    currentStreakDays: 5,
    activeToday: true,
    today,
  });
  client.setQueryData(streakKeys.celebrationBase(userId), {
    activeToday: false,
  });
  return client;
};

// 스트릭 도장 — 열매가 떨어져 오늘 칸이 차는 순간 차오름 리듬이 끝난다
const StreakPreview = () => {
  const userId = useCurrentUserId();
  const [client] = useState(() => createSandbox(userId));
  return (
    <QueryClientProvider client={client}>
      <div className="flex h-full items-center justify-center">
        <StreakStamp />
      </div>
    </QueryClientProvider>
  );
};

// 두 번째 오답 없이 끝난 문제 — 결과 화면은 표현·뜻과 맞혔는지만 그린다
const PREVIEW_EXPRESSIONS = [
  ['I’m down', '좋아, 할래'],
  ['No worries', '괜찮아'],
  ['Sounds good', '좋아'],
] as const;

const solvedQuestion = (
  [text, meaning]: readonly [string, string],
  id: number,
): ReviewQuestion => ({
  questionId: `preview-${id}`,
  expressionId: id,
  targetExpressionText: text,
  baseExpressionMeaningText: meaning,
  quiz: {
    quizLanguage: 'EN',
    writingSentenceText: text,
    writingSentenceTranslation: meaning,
    writingQuestion: meaning,
    writingQuestionTranslation: meaning,
    writingSentenceWords: text.split(' '),
    writingSentenceWordChoices: text.split(' '),
    writingSentenceAcceptedAnswers: [text.split(' ')],
  },
  displayOrder: id,
  queueOrder: id,
  wrongCount: 0,
  completedAt: new Date().toISOString(),
});

const PERFECT_REVIEW = PREVIEW_EXPRESSIONS.map(solvedQuestion);

// 헤더 알약 자리 — 실제 화면의 오른쪽 위 환급 알약쯤
const PILL = { left: 24, top: 60, width: 96, height: 32 };

export const RhythmPreview = ({
  rhythm,
  onClose,
}: {
  rhythm: HapticRhythm;
  onClose: () => void;
}) => {
  // Android 뒤로가기도 점검 화면을 떠나지 않고 미리보기만 닫는다
  useBackPress(onClose);

  // 동전과 숫자 리듬은 한 동전 연출 안에서 차례로 울린다
  if (rhythm === 'coins' || rhythm === 'countUp') {
    return (
      <CoinShower
        pill={PILL}
        fromWon={1500}
        toWon={2000}
        onEnd={onClose}
        preview
      />
    );
  }

  if (rhythm === 'burst') {
    return (
      <div className="fixed inset-0 z-[70] bg-background">
        <ReviewComplete
          questions={PERFECT_REVIEW}
          justFinished
          onHome={onClose}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background">
      <div className="flex-1">
        <StreakPreview />
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mx-4 mb-[max(var(--safe-area-inset-bottom),16px)] rounded-xl bg-primary py-4 text-15 font-bold text-primary-foreground"
      >
        닫기
      </button>
    </div>
  );
};
