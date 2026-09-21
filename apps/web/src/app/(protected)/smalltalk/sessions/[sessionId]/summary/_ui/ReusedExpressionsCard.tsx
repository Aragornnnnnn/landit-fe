'use client';

// 랜딧에서 배운 표현을 실제로 사용했어요 — 표현마다 칩·출처·그때 내가 한 말·뜻.
// 둘까지 펼치고 셋째부터는 접어 둔다. 더 보기를 누르면 그 자리에서 펼친다
import { useState } from 'react';

import type { SmallTalkSummaryReusedExpression } from '@/features/small-talk/api/small-talk';
import { splitMatchedText } from '@/features/small-talk/model/message-feedback';
import { ChevronDownIcon } from '@/shared/ui/Icons';

// 처음에 펼쳐 두는 개수
const VISIBLE_COUNT = 2;
// 이만큼은 접혀야 접는다 — 한 줄 보자고 한 번 누르게 하는 건 누르는 값이 없다.
// 표현이 셋이면 그냥 셋 다 편다
const MIN_FOLDED = 2;

export const ReusedExpressionsCard = ({
  items,
}: {
  items: SmallTalkSummaryReusedExpression[];
}) => {
  const [expanded, setExpanded] = useState(false);
  const folded = !expanded && items.length - VISIBLE_COUNT >= MIN_FOLDED;
  const visible = folded ? items.slice(0, VISIBLE_COUNT) : items;
  const hiddenCount = items.length - visible.length;

  return (
    <section className="rounded-2xl bg-card px-5 py-4 shadow-sm">
      <h2 className="text-[14px] font-extrabold text-primary">
        랜딧에서 배운 표현을 실제로 사용했어요
      </h2>
      <ul className="mt-1 flex flex-col divide-y divide-border">
        {/* 같은 표현을 두 메시지에서 썼으면 표현 id만으로는 겹친다 — 쓴 자리까지 합쳐 가른다 */}
        {visible.map((item, index) => (
          <li
            key={`${item.messageId}-${item.expressionId}`}
            // 펼쳐서 새로 나온 줄만 떠오르게 한다 — 처음부터 있던 둘은 가만히 둔다
            className={`py-3 ${expanded && index >= VISIBLE_COUNT ? 'animate-fade-up' : ''}`}
            style={
              expanded && index >= VISIBLE_COUNT
                ? { animationDelay: `${(index - VISIBLE_COUNT) * 70}ms` }
                : undefined
            }
          >
            <ReusedExpression item={item} />
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="flex w-full items-center justify-center gap-1 pt-3 text-[13px] font-semibold text-muted-foreground active:opacity-70"
        >
          +{hiddenCount}개 더 보기
          <ChevronDownIcon size={14} />
        </button>
      )}
    </section>
  );
};

const ReusedExpression = ({
  item,
}: {
  item: SmallTalkSummaryReusedExpression;
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2.5">
      <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[15px] font-bold text-primary">
        {item.text}
      </span>
      <span className="text-[12px] text-muted-foreground">
        {item.sourceLabel}
      </span>
    </div>
    <p className="text-[15px] leading-6 text-foreground">
      “<QuotedSentence item={item} />”
    </p>
    <p className="text-[13px] text-muted-foreground">{item.meaning}</p>
  </div>
);

// 그때 내가 한 말 — 그 표현 구절만 굵게. 못 찾으면 문장 그대로
const QuotedSentence = ({
  item,
}: {
  item: SmallTalkSummaryReusedExpression;
}) => {
  const split = splitMatchedText(item.quotedSentence, item.matchedText);
  if (!split) return item.quotedSentence;

  return (
    <>
      {split.before}
      <strong className="font-bold">{split.match}</strong>
      {split.after}
    </>
  );
};
