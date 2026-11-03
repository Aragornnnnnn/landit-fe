// 상대가 답을 생각하는 동안 말풍선 자리에 띄우는 점 세 개 — 메신저의 "입력 중"과 같은 모습으로 다음 말이 올 자리를 알린다
import { useTranslations } from 'next-intl';

import { ListeningDots } from './ListeningDots';

export const ThinkingBubble = () => {
  const t = useTranslations('conversation.thinkingBubble');
  return (
    <div className="w-fit rounded-[28px] rounded-tl-md bg-card px-5 py-4 shadow-lg shadow-black/5">
      <ListeningDots spaced={false} label={t('thinkingLabel')} />
    </div>
  );
};
