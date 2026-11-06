'use client';

// 리뷰 벽 — 순위대로 왼쪽에서 오른쪽, 위에서 아래로 놓는다. 처음엔 모바일은 두 장, 태블릿 이상은 세 줄에 조금 못 미치게 보이고 뒤의 리뷰가 흐리게 비치며, 그 위의 더보기를 누르면 전부 펼쳐진다. 접혀 있어도 글은 HTML에 그대로 있다
import { useState } from 'react';

import { maskName } from '@/shared/lib/mask-name';
import { Emoji } from '@/shared/ui/emoji';

import { LANDING_REVIEWS } from '../_model/landing-reviews';
import { StarIcon } from './StarIcon';

/** 사람 사진 대신 토스페이스 얼굴 — 실제 글쓴이처럼 보이지 않게 한다 */
const AVATARS = ['😀', '🥰', '😎', '🤩', '😄', '🤓', '😊', '🥳', '🙂'];

export const ReviewWall = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative mt-12 sm:mt-16">
      <div
        className={`overflow-hidden transition-[max-height] duration-700 ease-out ${open ? 'max-h-[6000px]' : 'max-h-[500px] sm:max-h-[780px]'}`}
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LANDING_REVIEWS.map(({ body, author, date }, index) => (
            <li
              key={body}
              className="flex flex-col rounded-[20px] bg-[#f5f5f3] p-7"
            >
              <span aria-hidden="true" className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((star) => (
                  <StarIcon key={star} className="size-6" />
                ))}
              </span>
              <blockquote className="mt-4 text-[17px] leading-[1.7] break-keep text-[#2f2c29]">
                {body}
              </blockquote>
              <div className="mt-auto flex items-center gap-3 pt-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[21px]">
                  <Emoji>{AVATARS[index % AVATARS.length]}</Emoji>
                </span>
                <p className="text-[13px] leading-snug text-[#57524c]">
                  <span className="font-semibold text-foreground">
                    {maskName(author)}
                  </span>
                  <br />
                  {date}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {!open && (
        <div className="absolute inset-x-0 bottom-0 flex h-36 items-end justify-center bg-[linear-gradient(to_bottom,transparent,rgb(255_255_255/0.8)_65%,var(--color-card))] pb-5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full border border-black/8 bg-white px-5 py-2.5 text-[14px] font-semibold text-foreground shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-transform hover:-translate-y-0.5"
          >
            리뷰 더보기
          </button>
        </div>
      )}
    </div>
  );
};
