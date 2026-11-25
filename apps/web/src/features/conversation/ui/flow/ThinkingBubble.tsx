// 상대가 답을 생각하는 동안 대화 칸 맨 아래에 띄우는 작은 말풍선 — 점 세 개가 물결처럼 떠올라 다음 말이 곧 온다는 걸 알린다
import { useTranslations } from 'next-intl';

import { PARTNER_BUBBLE_SURFACE } from './ChatBubbles';

export const ThinkingBubble = () => {
  const t = useTranslations('conversation.thinkingBubble');
  return (
    <div className={`self-start px-3.5 py-[9px] ${PARTNER_BUBBLE_SURFACE}`}>
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
