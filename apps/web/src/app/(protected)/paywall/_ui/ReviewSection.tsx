// 「먼저 시작한 유저들의 이야기」 — 스토어 평점과 실제 리뷰를 옆으로 넘겨 본다
import type { CSSProperties } from 'react';
import Image from 'next/image';

import {
  maskName,
  RANDY,
  REVIEWS,
  STORE_RATING,
  STORE_RATING_AS_OF,
} from '../_model/paywall-content';
import { RevealSection } from './RevealSection';
import { Highlight, SectionHeading } from './SectionHeading';

const Stars = ({ className }: { className: string }) => (
  <span aria-hidden="true" className={`text-primary ${className}`}>
    ★★★★★
  </span>
);

export const ReviewSection = () => (
  <div className="pt-14">
    <RevealSection>
      <SectionHeading
        title={
          <>
            <Highlight>먼저 시작한 유저들</Highlight>의 이야기
          </>
        }
      />
      <div className="relative mt-5 flex items-center gap-2.5 px-6">
        <p className="reveal-up text-[34px] leading-none font-bold tracking-[-0.02em] text-foreground">
          {STORE_RATING}
        </p>
        <div className="reveal-up" style={{ '--i': 1 } as CSSProperties}>
          <Stars className="text-base tracking-[0.08em]" />
          <p className="text-xs text-muted-foreground">
            스토어 평점{' '}
            <span className="text-[10px] text-[#b0b0ad]">
              · {STORE_RATING_AS_OF} 기준
            </span>
          </p>
        </div>
        {/* 하트를 안은 래디가 첫 리뷰 카드 뒤에서 고개를 내민다 — 비교표 래디처럼 감싸는 칸 아랫변을 카드 윗변(아래 리뷰 줄과의 간격 16px)에 맞춰 발을 잘라 낸다 */}
        <div className="absolute -bottom-4 left-[224px] h-[62px] w-[76px] overflow-hidden">
          <Image
            src={RANDY.heart}
            alt=""
            width={76}
            height={76}
            className="reveal-peek absolute top-0 left-0 size-[76px]"
          />
        </div>
      </div>
    </RevealSection>

    <RevealSection className="mt-4">
      <ul className="flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pb-2">
        {REVIEWS.map((review, index) => (
          <li
            key={review.body}
            className="reveal-up flex h-[231px] w-[286px] shrink-0 snap-start flex-col gap-2 rounded-[20px] border border-[#e9e7e2] bg-card p-5 shadow-[0_2px_10px_rgba(51,38,26,0.05)]"
            style={{ '--i': index } as CSSProperties}
          >
            <Stars className="text-xs tracking-[0.06em]" />
            {review.title && (
              <p className="text-sm leading-[22px] font-bold tracking-[-0.01em] text-foreground">
                {review.title}
              </p>
            )}
            <p className="line-clamp-5 text-[13.5px] leading-[21px] tracking-[-0.01em] text-[#3d3d3f]">
              {review.body}
            </p>
            <p className="mt-auto text-xs text-muted-foreground">
              {review.author
                ? `${maskName(review.author)} · ${review.date}`
                : '스토어 리뷰'}
            </p>
          </li>
        ))}
      </ul>
    </RevealSection>
  </div>
);
