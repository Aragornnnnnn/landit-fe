'use client';

// 세션 피드백 화면 — 생성 중엔 총평 스켈레톤을 보이고(대개 미리 만들어 잠깐), 완료되면 총평/상세로 넘긴다
import { Button } from '@/shared/ui/Button';

import { useSessionFeedback } from '../model/useSessionFeedback';
import { Feedback } from './Feedback';
import { FeedbackSkeleton } from './FeedbackSkeleton';

interface SessionFeedbackScreenProps {
  sessionId: number | null;
  title: string;
  onExit: () => void;
}

export const SessionFeedbackScreen = ({
  sessionId,
  title,
  onExit,
}: SessionFeedbackScreenProps) => {
  const { feedback, error } = useSessionFeedback(sessionId);

  if (feedback) {
    return <Feedback feedback={feedback} title={title} onExit={onExit} />;
  }

  // 세션이 없거나 생성이 실패하면 조용히 다음 단계로 보낸다 (대화는 이미 끝났다)
  if (sessionId === null || error) {
    return (
      <main className="mx-auto flex h-dvh max-w-[430px] flex-col items-center justify-center gap-6 bg-background px-6">
        <p className="text-center text-base font-medium text-muted-foreground">
          피드백을 불러오지 못했어요.
        </p>
        <Button className="w-auto px-8" onClick={onExit}>
          다음으로
        </Button>
      </main>
    );
  }

  // 생성 중 — 총평 골격 스켈레톤
  return <FeedbackSkeleton />;
};
