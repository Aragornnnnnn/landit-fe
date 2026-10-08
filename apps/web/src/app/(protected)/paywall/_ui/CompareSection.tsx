// 「무료 vs 프리미엄」 — 기존 비교표를 카드에 담는다. 프리미엄 열 체크는 카드가 보일 때 위에서부터 켜진다
import Image from 'next/image';

import { BenefitComparison } from '@/features/subscription/ui/product/BenefitComparison';

import { RANDY } from '../_model/paywall-content';
import { RevealSection } from './RevealSection';
import { Highlight, SectionHeading } from './SectionHeading';

export const CompareSection = () => (
  <div className="pt-14">
    <RevealSection>
      <SectionHeading
        title={
          <>
            무료 vs <Highlight>프리미엄</Highlight>
          </>
        }
      />
    </RevealSection>
    {/* 체크 연출(animate-check-in)은 data-inview가 켜질 때까지 globals.css가 미룬다 */}
    <RevealSection className="relative mt-4 px-5">
      {/* 래디는 아래가 잘린 '빼꼼' 그림이라 허공에 띄우면 어색하다 — 잘린 선을 카드 윗변에 맞춰 프리미엄 열 위로 고개를 내민다.
          제목 줄 오른쪽 빈자리에 겹쳐 앉아 따로 높이를 먹지 않는다. 감싸는 칸이 아래를 잘라 카드 뒤에서 올라오는 것처럼 보인다 */}
      <div className="absolute right-9 bottom-[calc(100%-1px)] h-[76px] w-[84px] overflow-hidden">
        <Image
          src={RANDY.peek}
          alt=""
          width={84}
          height={84}
          className="reveal-peek absolute top-0 left-0 size-[84px]"
        />
      </div>
      <div className="reveal-up relative rounded-3xl border border-[#e9e7e2] bg-card pt-1 pb-4 shadow-[0_2px_5px_rgba(51,38,26,0.05)] [&>section]:px-4">
        <BenefitComparison />
      </div>
    </RevealSection>
  </div>
);
