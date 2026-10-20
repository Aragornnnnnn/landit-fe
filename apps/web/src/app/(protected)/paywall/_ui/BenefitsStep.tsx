// 환급 페이월 1단계 — 혜택 화면. 매일 오는 시나리오(카드 벽) 위에 프리미엄만 누리는 혜택 넷을 쌓고, 맨 아래 리뷰를 옆으로 넘겨 보게 둔다.
// 시나리오는 무료로도 하니 혜택이 아니라 무대로만 쓴다. 결제는 다음 단계(결제 금액 안내)에서 한다. 피그마 「페이월 v4 · 전체 스크롤」(3514:322)
import { formatWon } from '@/features/subscription/lib/won';
import { PremiumBadge } from '@/features/subscription/ui/premium-brand';

import {
  maskName,
  REVIEWS,
  STORE_RATING,
  type RewardPlan,
} from '../_model/paywall-content';
import { CoinStackCard } from './CoinStackCard';
import { ExampleDemo } from './ExampleDemo';
import {
  BetterTurnDemo,
  GoodTurnDemo,
  GrowthDemo,
  ReuseDemo,
  SummaryDemo,
} from './FeedbackDemo';
import { PronunciationDemo } from './PronunciationDemo';
import { QuizDemo } from './QuizDemo';
import { ScenarioWall } from './ScenarioWall';
import { SERIES_SCREEN_WIDTH, SeriesCarousel } from './SeriesCarousel';
import { SmallTalkDemo } from './SmallTalkDemo';
import { UsageDemo } from './UsageDemo';

const width = SERIES_SCREEN_WIDTH;

/** 「프리미엄」 금색 글자 — 빛이 한 번씩 훑고 지나간다 */
const PremiumWord = () => (
  <span className="animate-text-shine bg-[linear-gradient(110deg,#d98f2a_40%,#fff1c2_50%,#d98f2a_60%)] bg-[length:250%_100%] bg-clip-text text-transparent">
    프리미엄
  </span>
);

export const BenefitsStep = ({ plan }: { plan: RewardPlan }) => (
  <>
    {/* 위 여백 40px은 겹쳐 떠 있는 PaywallHeader의 줄 높이(h-10)다 */}
    <section
      data-inview="true"
      className="bg-[#fbf6ef] pt-[calc(max(var(--safe-area-inset-top),8px)+40px)] text-center"
    >
      <div className="flex justify-center pt-1.5">
        <PremiumBadge />
      </div>
      <h2 className="mt-4 px-6 text-[26px] leading-[36px] font-black tracking-[-0.025em] whitespace-pre-line text-foreground">
        {'매일 도착하는 시나리오\n'}
        <PremiumWord />
        으로 제대로 공부해요
      </h2>
      <ScenarioWall />
    </section>

    {/* 혜택 판 — 맨 위 머리글이 아래 넷을 프리미엄 전용으로 묶는다 */}
    <div className="rounded-t-[28px] bg-card pt-8 pb-10 shadow-[0_-6px_18px_rgba(51,31,13,0.06)]">
      <div className="px-6">
        <span className="inline-block rounded-full bg-[#f6c54a] px-2.5 py-1 text-xs font-black tracking-wide text-[#3a2a00]">
          PREMIUM ONLY
        </span>
        <p className="mt-3 text-2xl font-black tracking-[-0.02em] text-foreground">
          프리미엄만 누리는 혜택 4가지
        </p>
      </div>

      <div className="mt-11 flex flex-col gap-11">
        <section className="px-6">
          <p className="text-[15px] font-black text-primary">01</p>
          <p className="mt-1 text-[21px] font-extrabold tracking-[-0.02em] text-foreground">
            시나리오 끝낼 때마다 {formatWon(plan.dailyRefund)} 적립
          </p>
          <div className="mt-4">
            <CoinStackCard plan={plan} />
          </div>
        </section>

        <SeriesCarousel
          number="02"
          label="문장마다 꼼꼼한 상세 피드백"
          items={[
            {
              title: '잘한 문장은 왜 좋은지',
              screen: <GoodTurnDemo step={0} width={width} />,
            },
            {
              title: '어색한 문장은 이렇게',
              screen: <BetterTurnDemo step={0} width={width} />,
            },
            {
              title: '대화 전체를 한눈에',
              screen: <SummaryDemo step={0} width={width} />,
            },
            {
              title: '지난번보다 나아진 점',
              screen: <GrowthDemo step={0} width={width} />,
            },
            {
              title: '배운 표현을 실제로 썼는지',
              screen: <ReuseDemo step={0} width={width} />,
            },
          ]}
        />

        <SeriesCarousel
          number="03"
          label="내 대화로 만든 맞춤 표현 학습"
          items={[
            {
              title: '그림과 예문으로 실제 뉘앙스까지',
              screen: <ExampleDemo step={2} width={width} />,
            },
            {
              title: '원어민처럼 발음하게 만들어드려요',
              screen: <PronunciationDemo step={3} width={width} />,
            },
            {
              title: '여러 예문으로 확실히 내 표현으로',
              screen: <UsageDemo step={0} width={width} />,
            },
            {
              title: '퀴즈로 내 것이 됐는지 확인해요',
              screen: <QuizDemo step={2} width={width} />,
            },
          ]}
        />

        <SeriesCarousel
          number="04"
          label="캐릭터와 자유롭게 프리톡"
          items={[
            {
              title: '원하는 친구와 억양까지 골라서',
              screen: <SmallTalkDemo step={2} width={width} />,
            },
            {
              title: '주제 없이 자유롭게 대화해요',
              screen: <SmallTalkDemo step={3} width={width} />,
            },
          ]}
        />
      </div>

      {/* 리뷰 — 스토어에 실제로 달린 글 그대로, 옆으로 넘겨 본다 */}
      <section className="mt-14">
        <div className="px-6">
          <p className="text-[21px] font-extrabold tracking-[-0.02em] text-foreground">
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
              <p className="text-xs text-muted-foreground">스토어 평점</p>
            </div>
          </div>
        </div>
        <ul className="mt-4 flex snap-x snap-mandatory scroll-px-6 items-start gap-3 overflow-x-auto px-6 pb-2">
          {REVIEWS.map((review) => (
            <li
              key={review.body}
              className="flex w-[286px] shrink-0 snap-start flex-col rounded-[20px] bg-background p-5"
            >
              <span aria-hidden="true" className="text-xs text-primary">
                ★★★★★
              </span>
              {review.title && (
                <p className="mt-1.5 text-[15px] font-bold break-keep text-foreground">
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
      </section>
    </div>
  </>
);
