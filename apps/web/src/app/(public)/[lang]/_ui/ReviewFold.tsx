'use client';

// 리뷰 접기 — 리뷰 벽에서 브라우저가 맡는 건 펼치기 하나뿐이라 이것만 클라이언트로 둔다. 리뷰 글·얼굴 그림은 서버가 그려 children으로 넘긴다
import { useState } from 'react';

export const ReviewFold = ({
  moreLabel,
  children,
}: {
  moreLabel: string;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative mt-12 sm:mt-16">
      <div
        className={`overflow-hidden transition-[max-height] duration-700 ease-out ${open ? 'max-h-[6000px]' : 'max-h-[500px] sm:max-h-[780px]'}`}
      >
        {children}
      </div>
      {!open && (
        <div className="absolute inset-x-0 bottom-0 flex h-36 items-end justify-center bg-[linear-gradient(to_bottom,transparent,rgb(255_255_255/0.8)_65%,var(--color-card))] pb-5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full border border-black/8 bg-white px-5 py-2.5 text-[14px] font-semibold text-foreground shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-transform hover:-translate-y-0.5"
          >
            {moreLabel}
          </button>
        </div>
      )}
    </div>
  );
};
