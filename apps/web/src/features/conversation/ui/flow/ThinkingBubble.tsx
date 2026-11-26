// 상대가 답을 생각하는 동안 대화 칸 맨 아래에 띄우는 작은 말풍선 — 점 세 개가 물결처럼 떠올라 다음 말이 곧 온다는 걸 알린다
'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { PARTNER_BUBBLE_SURFACE } from './ChatBubbles';
import { useChatScroll } from './ConversationLog';

// 점 말풍선의 높이 — 다음 말풍선이 이 높이에서부터 자라 나와, 점이 말풍선으로 커지는 것처럼 이어진다
export const THINKING_BUBBLE_HEIGHT_PX = 40;

interface ThinkingBubbleProps {
  // 꺼지면 제자리에서 흐려지며 빠진다 — 빠지는 동안 자리를 비켜 줘 다음 말풍선이 바로 그 자리에서 자란다
  shown?: boolean;
}

export const ThinkingBubble = ({ shown = true }: ThinkingBubbleProps) => {
  const t = useTranslations('conversation.thinkingBubble');
  const scroll = useChatScroll();
  const ref = useRef<HTMLDivElement>(null);

  // 긴 상대 말 아래에 붙으면 칸 밖에 놓일 수 있다 — 붙는 순간 칸에 따라 내려와 달라고 한다
  useEffect(() => {
    if (shown && ref.current) scroll?.follow(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 붙는 순간 한 번만. scroll은 렌더마다 새 객체다
  }, [shown]);

  return (
    // 처음부터 떠 있으면(대기 화면·첫 발화 준비) 바로 보인다 — 흐리게 나타나는 건 대화 중에 새로 붙을 때만
    <AnimatePresence initial={false} mode="popLayout">
      {shown && (
        <motion.div
          ref={ref}
          key="thinking"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`self-start px-3.5 py-[9px] ${PARTNER_BUBBLE_SURFACE}`}
        >
          <span role="status" className="flex h-[1.35em] items-center gap-1.5">
            <span className="sr-only">{t('thinkingLabel')}</span>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="animate-listening-wave size-1.5 rounded-full bg-muted-foreground"
                style={{ '--i': i } as React.CSSProperties}
              />
            ))}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
