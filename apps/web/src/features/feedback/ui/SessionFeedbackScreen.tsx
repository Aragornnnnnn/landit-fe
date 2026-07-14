'use client';

// 세션 피드백 화면 — 피드백을 생성(POST)하는 동안 분석 연출을 보여주고, 완료되면 총평/상세로 넘긴다
import { motion } from 'motion/react';

import { Button } from '@/shared/ui/Button';
import { CharacterSlot } from '@/shared/ui/CharacterSlot';

import { useSessionFeedback } from '../model/useSessionFeedback';
import { Feedback } from './Feedback';

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
  const { feedback, error, isLoading } = useSessionFeedback(sessionId);

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

  // 생성 중 — 캐릭터가 대화를 분석하는 연출
  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col items-center justify-center gap-8 bg-background px-6">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <CharacterSlot size={104} />
      </motion.div>
      <p className="text-center text-xl leading-relaxed font-extrabold text-foreground">
        대화를 분석하고 있어요
      </p>
      {isLoading && (
        <span className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      )}
    </main>
  );
};
