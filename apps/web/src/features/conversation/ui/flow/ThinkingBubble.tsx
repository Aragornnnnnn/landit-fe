// 상대가 답을 생각하는 동안 대화 칸 맨 아래에 띄우는 작은 말풍선 — 점 세 개가 물결처럼 떠올라 다음 말이 곧 온다는 걸 알린다
'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

import { PARTNER_BUBBLE_SURFACE } from './ChatBubbles';
import { useChatScroll } from './ConversationLog';

export const ThinkingBubble = () => {
  const t = useTranslations('conversation.thinkingBubble');
  const scroll = useChatScroll();
  const ref = useRef<HTMLDivElement>(null);

  // 긴 상대 말 아래에 붙으면 칸 밖에 놓일 수 있다 — 붙는 순간 칸에 따라 내려와 달라고 한다
  useEffect(() => {
    if (ref.current) scroll?.follow(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 붙는 순간 한 번만. scroll은 렌더마다 새 객체다
  }, []);

  return (
    <div
      ref={ref}
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
    </div>
  );
};
