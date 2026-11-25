// 상황 카드 — 내가 먼저 거는 대화의 첫 턴, 대화 칸 가운데에 상황을 알려 주는 카드. 라벨 → 상황 순서로 읽힌다.
// 말풍선과 헷갈리지 않게 가운데 정렬·꼬리 없음. 따로 접지 않고, 대화가 쌓이면 다른 말풍선처럼 위로 밀려 흐려진다
import { useTranslations } from 'next-intl';

export const SituationCard = ({ text }: { text: string }) => {
  const t = useTranslations('conversation.situationCard');
  return (
    <section
      aria-label={t('label')}
      className="flex w-[320px] max-w-full flex-col items-center gap-3 self-center rounded-[22px] bg-card px-[22px] py-[18px] text-center shadow-[0_8px_12px_rgba(0,0,0,0.1)]"
    >
      <p className="rounded-full bg-selected px-2.5 py-1 text-12 font-bold text-accent">
        {t('label')}
      </p>
      <p className="text-16 leading-normal font-medium break-words whitespace-pre-line text-foreground">
        {text}
      </p>
    </section>
  );
};
