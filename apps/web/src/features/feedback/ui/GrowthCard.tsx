// 실수 기억 카드 — 지난번에 교정받은 패턴이 오늘 다시 나왔을 때, 그때 문장과 오늘 문장을 나란히 놓는다.
// 오늘 맞았으면 초록, 또 틀렸으면 빨강. 여러 패턴이어도 서버가 하나만 고른다. 스몰톡 요약과 시나리오 총평이 같이 쓴다
import { useLocale, useTranslations } from 'next-intl';

import { toDayLabel } from '@/shared/lib/day-label';
import { splitMatchedText } from '@/shared/lib/matched-text';

import type { ScenarioGrowthCard } from '../api/session-feedback';

export const GrowthCard = ({
  growth,
  className = '',
}: {
  growth: ScenarioGrowthCard;
  className?: string;
}) => {
  const t = useTranslations('feedback.growthCard');
  const locale = useLocale();
  return (
    <section className={`rounded-2xl bg-card px-5 py-4 shadow-sm ${className}`}>
      <h2 className="text-14 font-extrabold text-primary">
        {growth.succeeded
          ? t('succeededTitle', { pattern: growth.patternLabel })
          : t('stillTitle', { pattern: growth.patternLabel })}
      </h2>
      <dl className="mt-3 flex flex-col gap-2 rounded-xl bg-secondary px-4 py-3">
        <div className="flex gap-3">
          <dt className="w-[calc(56px*var(--font-scale))] shrink-0 text-13 whitespace-nowrap text-muted-foreground">
            {toDayLabel(growth.previousDate, locale)}
          </dt>
          <dd className="text-15 leading-6 text-muted-foreground">
            <Highlighted
              sentence={growth.previousSentence}
              span={growth.previousWrongSpan}
              className="font-bold text-destructive line-through"
            />
          </dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-[calc(56px*var(--font-scale))] shrink-0 text-13 whitespace-nowrap text-muted-foreground">
            {t('todayLabel')}
          </dt>
          <dd className="text-15 leading-6 font-bold text-foreground">
            <Highlighted
              sentence={growth.currentSentence}
              span={growth.currentSpan}
              className={growth.succeeded ? 'text-success' : 'text-destructive'}
            />
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-13 leading-5 text-muted-foreground">
        {growth.succeeded ? t('succeededBody') : t('stillBody')}
      </p>
    </section>
  );
};

// 문장 속 한 구절만 강조 — 구절을 못 찾으면 문장 그대로
const Highlighted = ({
  sentence,
  span,
  className,
}: {
  sentence: string;
  // 서버가 구절을 특정하지 못했으면 null — 그때는 문장만 보여준다
  span: string | null;
  className: string;
}) => {
  const split = splitMatchedText(sentence, span ?? undefined);
  if (!split) return sentence;

  return (
    <>
      {split.before}
      <span className={className}>{split.match}</span>
      {split.after}
    </>
  );
};
