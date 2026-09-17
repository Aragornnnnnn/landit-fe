'use client';

// 세션 피드백 흐름 진입점 — 생성 중엔 총평 스켈레톤을 보이고(대개 미리 만들어 잠깐), 완료되면 총평/상세로 넘긴다
import { Button } from '@/shared/ui/Button';

import { useSessionFeedbackQuery } from '../model/useSessionFeedbackQuery';
import { FeedbackContent } from './flow/FeedbackContent';
import { FeedbackSkeleton } from './flow/FeedbackSkeleton';

interface FeedbackFlowProps {
  sessionId: number | null;
  title: string;
  /** 총평을 건너뛰고 상세부터 — 결제하고 돌아온 길 */
  openDetail?: boolean;
  onExit: () => void;
  /** 서버가 잠근 상세를 보려고 했다 — 호출부가 페이월로 보낸다 */
  onDetailLocked: () => void;
}

// 세션이 없거나 생성이 실패했을 때 — 조용히 다음 단계로 보낸다 (대화는 이미 끝났다)
const FeedbackUnavailable = ({ onExit }: { onExit: () => void }) => (
  <main className="mx-auto flex h-dvh max-w-[430px] flex-col items-center justify-center gap-6 bg-background px-6">
    <p className="text-center text-base font-medium text-muted-foreground">
      피드백을 불러오지 못했어요.
    </p>
    <Button className="w-auto px-8" onClick={onExit}>
      다음으로
    </Button>
  </main>
);

export const FeedbackFlow = ({
  sessionId,
  title,
  openDetail = false,
  onExit,
  onDetailLocked,
}: FeedbackFlowProps) => {
  const { feedback, error, isRefreshing } = useSessionFeedbackQuery(sessionId);

  if (sessionId === null || error)
    return <FeedbackUnavailable onExit={onExit} />;
  if (!feedback) return <FeedbackSkeleton />;

  return (
    <FeedbackContent
      feedback={feedback}
      title={title}
      openDetail={openDetail}
      refreshing={isRefreshing}
      onExit={onExit}
      onDetailLocked={onDetailLocked}
    />
  );
};
