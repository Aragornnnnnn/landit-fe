// 상대가 답을 생각하는 동안 띄우는 빈 말 칸 — 글자가 시작될 자리에 점 세 개가 물결처럼 떠올라 다음 말이 곧 온다는 걸 알린다
import { useTranslations } from 'next-intl';

export const ThinkingBubble = () => {
  const t = useTranslations('conversation.thinkingBubble');
  return (
    <div className="max-h-full min-h-30 w-full rounded-[28px] rounded-tl-md bg-card px-5 py-5 shadow-lg shadow-black/5">
      <span role="status" className="flex h-7 items-center gap-1.5">
        <span className="sr-only">{t('thinkingLabel')}</span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="animate-listening-wave size-2 rounded-full bg-muted-foreground"
            style={{ '--i': i } as React.CSSProperties}
          />
        ))}
      </span>
    </div>
  );
};
