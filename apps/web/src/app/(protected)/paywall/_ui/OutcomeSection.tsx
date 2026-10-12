// 「100일 꾸준히 하면 이만큼 할 수 있어요」 — 6개월 평균 습득 표현·대화 시간을 챌린지 기간으로 환산해 백 단위로 내려 말한다. 환급과는 먼 이야기라 환급 무대 밖, 「그림으로 배우면」 아래에 다른 섹션과 같은 모양으로 둔다
import { CHALLENGE_DAYS } from '@/features/reward/model/refund-offer';

import {
  AVERAGE_TALK_MINUTES,
  LEARNABLE_EXPRESSION_COUNT,
  OUTCOME_AS_OF,
  OUTCOME_DAYS,
  REWARD_CHALLENGE_PERIOD,
} from '../_model/paywall-content';
import { RevealSection } from './RevealSection';
import { Highlight, SectionHeading } from './SectionHeading';

/** 6개월 평균을 챌린지 기간으로 환산해 백 단위로 내린다 — 「300개」처럼 딱 떨어지게, 실제보다 부풀리지 않게 */
const forChallenge = (value: number) =>
  Math.floor((value * CHALLENGE_DAYS) / OUTCOME_DAYS / 100) * 100;

// 한 문장으로 읽히게 숫자를 문장 가운데에 둔다 — 「원어민 표현을 300개 배울 수 있어요」
const OUTCOMES = [
  {
    lead: '원어민 표현을',
    amount: `${forChallenge(LEARNABLE_EXPRESSION_COUNT).toLocaleString()}개`,
    tail: '배울 수 있어요',
  },
  {
    lead: '영어로',
    amount: `${forChallenge(AVERAGE_TALK_MINUTES).toLocaleString()}분`,
    tail: '대화할 수 있어요',
  },
];

export const OutcomeSection = () => (
  <RevealSection className="pt-14">
    <SectionHeading
      title={
        <>
          {`${REWARD_CHALLENGE_PERIOD} 꾸준히 하면\n`}
          <Highlight>이만큼 할 수 있어요</Highlight>
        </>
      }
    />
    <ul className="reveal-up mx-5 mt-5 divide-y divide-[#f1ede8] rounded-3xl border border-[#ebe7e1] bg-card px-6 shadow-[0_6px_20px_rgba(51,38,26,0.08)]">
      {OUTCOMES.map((outcome) => (
        <li
          key={outcome.lead}
          className="flex flex-wrap items-baseline gap-x-2 py-5 text-[16px] font-bold break-keep text-foreground"
        >
          {outcome.lead}
          <span className="text-[32px] leading-none font-black tracking-[-0.03em] text-primary tabular-nums">
            {outcome.amount}
          </span>
          {outcome.tail}
        </li>
      ))}
    </ul>
    {/* 두 숫자가 무엇의 평균인지, 언제 기준인지 */}
    <p className="reveal-up mt-2 px-6 text-[11px] tracking-[-0.01em] text-[#a89a8b]">
      꾸준히 학습한 유저 평균 · {OUTCOME_AS_OF} 기준
    </p>
  </RevealSection>
);
