// 단계형 페이월 1단계 — 혜택 화면. 매일 오는 시나리오(카드 벽) 위에 프리미엄만 누리는 혜택을 쌓고, 맨 아래 리뷰를 옆으로 넘겨 보게 둔다.
// 환급 챌린지면 맨 앞에 적립 혜택이 붙고(넷), 아니면 셋이다. 리뷰는 한국 스토어 글이라 한국어 화면에만 있다.
// 시나리오는 무료로도 하니 혜택이 아니라 무대로만 쓴다. 결제는 다음 단계(결제 금액 안내)에서 한다. 피그마 「페이월 v4 · 전체 스크롤」(3514:322)
import { useLocale, useTranslations } from 'next-intl';

import { rewardOfferOf } from '@/features/reward/model/refund-offer';
import { CoinStackCard } from '@/features/reward/ui/CoinStackCard';
import { formatWon } from '@/features/subscription/lib/won';
import { PremiumBadge } from '@/features/subscription/ui/premium-brand';
import { lineBreak } from '@/shared/i18n/rich';
import { useSnapIndex } from '@/shared/lib/useSnapIndex';

import {
  maskName,
  ratingAsOfLabel,
  REVIEWS,
  showsStoreReviews,
  STORE_RATING,
  STORE_RATING_AS_OF,
  type RewardPlan,
} from '../_model/paywall-content';
import { ExampleDemo } from './ExampleDemo';
import { PronunciationDemo } from './PronunciationDemo';
import { QuizDemo } from './QuizDemo';
import {
  BetterTurnDemo,
  GoodTurnDemo,
  GrowthDemo,
  ReuseDemo,
  SummaryDemo,
} from './RewardFeedbackDemo';
import { ScenarioWall } from './ScenarioWall';
import { SERIES_SCREEN_WIDTH, SeriesCarousel } from './SeriesCarousel';
import { SmallTalkDemo } from './SmallTalkDemo';
import { UsageDemo } from './UsageDemo';

const width = SERIES_SCREEN_WIDTH;

/** 「프리미엄」 금색 글자 — 빛이 한 번씩 훑고 지나간다. 문구의 `<premium>` 자리에 그린다 */
const premiumWord = (chunks: React.ReactNode) => (
  <span className="animate-text-shine bg-[linear-gradient(110deg,#d98f2a_40%,#fff1c2_50%,#d98f2a_60%)] bg-[length:250%_100%] bg-clip-text text-transparent">
    {chunks}
  </span>
);

/** 적립 혜택 밖의 시리즈 수 — 상세 피드백·표현 학습·스몰톡. 아래 SeriesCarousel 개수와 짝이다 */
const SERIES_COUNT = 3;

/** 혜택 번호 — 01·02… */
const numberOf = (index: number) => String(index + 1).padStart(2, '0');

export const BenefitsStep = ({
  reward,
}: {
  /** 환급 챌린지 값 — 있으면 맨 앞에 적립 혜택을 둔다 */
  reward: RewardPlan | null;
}) => {
  const t = useTranslations('paywall.benefitsStep');
  const locale = useLocale();
  // 적립 혜택이 앞에 붙으면 뒤 시리즈 번호가 하나씩 밀린다
  const offset = reward ? 1 : 0;

  return (
    <>
      {/* 위 여백 40px은 겹쳐 떠 있는 PaywallHeader의 줄 높이(h-10)다 */}
      <section
        data-inview="true"
        className="bg-[#fbf6ef] pt-[calc(max(var(--safe-area-inset-top),8px)+40px)] text-center"
      >
        {/* 낮은 화면에선 로고를 80%로 줄인다 — 레이아웃 자리까지 같이 줄도록 transform이 아니라 zoom */}
        <div className="flex justify-center pt-1.5 short:[zoom:0.8]">
          <PremiumBadge />
        </div>
        <h2 className="mt-4 px-6 text-26 leading-[calc(36/26)] font-black tracking-[-0.025em] whitespace-pre-line text-foreground short:mt-3 short:text-22 short:leading-[calc(30/22)]">
          {t.rich('title', { ...lineBreak, premium: premiumWord })}
        </h2>
        <ScenarioWall />
      </section>

      {/* 혜택 판 — 맨 위 머리글이 아래 혜택(환급이면 넷, 아니면 셋)을 프리미엄 전용으로 묶는다 */}
      <div className="rounded-t-[28px] bg-card pt-8 pb-10 shadow-[0_-6px_18px_rgba(51,31,13,0.06)] short:pt-6">
        <div className="px-6">
          <span className="inline-block rounded-full bg-[#f6c54a] px-2.5 py-1 text-xs font-black tracking-wide text-[#3a2a00]">
            PREMIUM ONLY
          </span>
          <p className="mt-3 text-2xl font-black tracking-[-0.02em] text-foreground short:mt-2 short:text-xl">
            {t('benefitsTitle', { count: offset + SERIES_COUNT })}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-11">
          {/* 환급은 한국어 화면에만 있어 문구를 옮기지 않는다 */}
          {reward && (
            <section className="px-6">
              <p className="text-15 font-black text-primary">{numberOf(0)}</p>
              <p className="mt-1 text-21 font-extrabold tracking-[-0.02em] text-foreground">
                시나리오 끝낼 때마다 {formatWon(reward.dailyRefund)} 적립
              </p>
              <div className="mt-4">
                <CoinStackCard offer={rewardOfferOf(reward.price)} />
              </div>
            </section>
          )}

          <SeriesCarousel
            number={numberOf(offset)}
            label={t('feedbackLabel')}
            items={[
              {
                title: t('goodTurnTitle'),
                screen: <GoodTurnDemo step={0} width={width} />,
              },
              {
                title: t('betterTurnTitle'),
                screen: <BetterTurnDemo step={0} width={width} />,
              },
              {
                title: t('summaryTitle'),
                screen: <SummaryDemo step={0} width={width} />,
              },
              {
                title: t('growthTitle'),
                screen: <GrowthDemo step={0} width={width} />,
              },
              {
                title: t('reuseTitle'),
                screen: <ReuseDemo step={0} width={width} />,
              },
            ]}
          />

          <SeriesCarousel
            number={numberOf(offset + 1)}
            label={t('expressionLabel')}
            items={[
              {
                title: t('expressionImageTitle'),
                screen: <ExampleDemo step={2} width={width} />,
              },
              {
                title: t('expressionPronunciationTitle'),
                screen: <PronunciationDemo step={3} width={width} />,
              },
              {
                title: t('expressionUsageTitle'),
                screen: <UsageDemo step={0} width={width} />,
              },
              {
                title: t('expressionQuizTitle'),
                screen: <QuizDemo step={2} width={width} />,
              },
            ]}
          />

          <SeriesCarousel
            number={numberOf(offset + 2)}
            label={t('smallTalkLabel')}
            items={[
              {
                title: t('smallTalkPartnerTitle'),
                screen: <SmallTalkDemo step={2} width={width} />,
              },
              {
                title: t('smallTalkFreeTitle'),
                screen: <SmallTalkDemo step={3} width={width} />,
              },
            ]}
          />
        </div>

        {showsStoreReviews(locale) && <StoreReviews />}
      </div>
    </>
  );
};

// 리뷰 — 스토어에 실제로 달린 글 그대로, 옆으로 넘겨 본다. 아래 점이 몇 장 중 몇 번째인지 알려 준다. 한국어 화면에만 있어 문구를 옮기지 않는다
const StoreReviews = () => {
  const { scrollRef, activeIndex, onScroll } =
    useSnapIndex<HTMLUListElement>('x');

  return (
    <section className="mt-14">
      <div className="px-6">
        <p className="text-21 font-extrabold tracking-[-0.02em] text-foreground">
          먼저 시작한 분들의 이야기
        </p>
        {/* 평점 숫자를 크게, 별과 출처는 옆에 두 줄로 — 숫자가 먼저 읽히게 */}
        <div className="mt-3 flex items-center gap-2.5">
          <span className="text-[34px] leading-none font-bold tracking-[-0.02em] text-foreground">
            {STORE_RATING}
          </span>
          <div>
            <span
              aria-hidden="true"
              className="text-base tracking-[0.08em] text-primary"
            >
              ★★★★★
            </span>
            <p className="text-xs text-muted-foreground">
              스토어 평점{' '}
              <span className="text-10 text-[#b0b0ad]">
                {ratingAsOfLabel(STORE_RATING_AS_OF)}
              </span>
            </p>
          </div>
        </div>
      </div>
      <ul
        ref={scrollRef}
        onScroll={onScroll}
        className="mt-4 flex snap-x snap-mandatory scroll-px-6 items-start gap-3 overflow-x-auto px-6 pb-2"
      >
        {REVIEWS.map((review) => (
          <li
            key={review.body}
            className="flex w-[286px] shrink-0 snap-start flex-col rounded-[20px] bg-background p-5"
          >
            <span aria-hidden="true" className="text-xs text-primary">
              ★★★★★
            </span>
            {review.title && (
              <p className="mt-1.5 text-15 font-bold break-keep text-foreground">
                {review.title}
              </p>
            )}
            <blockquote className="mt-1.5 text-sm leading-[1.6] break-keep text-[#5f5953]">
              {review.body}
            </blockquote>
            <p className="mt-3 text-xs text-muted-foreground">
              {review.author
                ? `${maskName(review.author)} · ${review.date}`
                : '스토어 리뷰'}
            </p>
          </li>
        ))}
      </ul>
      <div aria-hidden="true" className="mt-3 flex justify-center gap-1.5">
        {REVIEWS.map((review, index) => (
          <span
            key={review.body}
            data-testid="review-dot"
            data-active={index === activeIndex}
            className={`size-1.5 rounded-full transition-colors ${index === activeIndex ? 'bg-primary' : 'bg-[#dcd8d2]'}`}
          />
        ))}
      </div>
    </section>
  );
};
