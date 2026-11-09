// 리뷰 — else처럼 흰 바탕에 회색 카드를 세 칸으로 쌓는다. 숫자는 히어로 뱃지에만 둔다. 리뷰 더보기가 있다
import { RevealSection } from '@/shared/ui/RevealSection';

import { ReviewWall } from './ReviewWall';
import { Underline } from './Underline';

export const LandingReviews = () => (
  <RevealSection className="pt-24 pb-16 sm:py-32">
    <div className="mx-auto max-w-[1080px] px-4 sm:px-6">
      <h2 className="text-center text-[32px] leading-[1.4] font-bold break-keep sm:text-[44px]">
        내 영어가 <Underline mark="brush">통한 순간들</Underline>이
        <br />
        쌓이고 있어요
      </h2>
      <ReviewWall />
    </div>
  </RevealSection>
);
