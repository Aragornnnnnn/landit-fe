'use client';

// 세션 피드백 흐름 진입점 — 생성 중엔 총평 스켈레톤을 보이고(대개 미리 만들어 잠깐), 완료되면 총평/상세로 넘긴다
import { useTranslations } from 'next-intl';

import { useSessionFeedbackQuery } from '../model/useSessionFeedbackQuery';
import { FeedbackContent } from './flow/FeedbackContent';
import { FeedbackNotice } from './flow/FeedbackNotice';
import { FeedbackSkeleton } from './flow/FeedbackSkeleton';

interface FeedbackFlowProps {
  sessionId: number | null;
  title: string;
  /** 유료 구독 중인가 — 구독 조회는 호출부가 들고 있다 */
  premium: boolean;
  /** 총평을 건너뛰고 상세부터 — 결제하고 돌아온 길 */
  openDetail?: boolean;
  onExit: () => void;
  /** 서버가 잠근 상세를 보려고 했다 — 호출부가 페이월로 보낸다 */
  onDetailLocked: () => void;
}

// 세션이 없거나 생성이 실패했을 때 — 조용히 다음 단계로 보낸다 (대화는 이미 끝났다)
const FeedbackUnavailable = ({ onExit }: { onExit: () => void }) => {
  const t = useTranslations('feedback.feedbackFlow');
  return (
    <FeedbackNotice
      message={t('unavailableError')}
      actionLabel={t('nextButton')}
      onAction={onExit}
    />
  );
};

export const FeedbackFlow = ({
  sessionId,
  title,
  premium,
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
      source="post_conversation"
      premium={premium}
      openDetail={openDetail}
      refreshing={isRefreshing}
      onExit={onExit}
      onDetailLocked={onDetailLocked}
    />
  );
};
