'use client';

// 자주 묻는 질문 한 줄 — 누르면 답이 아래로 부드럽게 펼쳐진다. 접혀 있어도 답은 문서에 남아 검색엔진과 AI가 읽는다
import { useId, useState } from 'react';

export const FaqItem = ({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) => {
  const [open, setOpen] = useState(false);
  const answerId = useId();
  return (
    <div className="border-b border-border">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={answerId}
          onClick={() => setOpen((value) => !value)}
          className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left text-[17px] font-bold break-keep"
        >
          {question}
          <span
            aria-hidden="true"
            className={`text-xl leading-none text-[#57524c] transition-transform duration-300 ${open ? 'rotate-45' : ''}`}
          >
            +
          </span>
        </button>
      </h3>
      {/* 높이를 0fr→1fr로 바꿔 내용 높이를 몰라도 부드럽게 펼친다 */}
      <div
        id={answerId}
        role="region"
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <p className="pb-5 text-16 leading-relaxed break-keep text-[#57524c]">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};
