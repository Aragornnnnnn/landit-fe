// 환급이 무엇인지 알려 주는 한 덩어리 — 동전 더미 그림, 돌려받는 최대 금액, 규칙 다섯 줄, 하루를 다 채웠을 때의 보기 내역.
// 결제 전의 환급 소개 화면과 결제 직후(알람 바로 앞) 화면이 같은 모습으로 쓴다
import Image from 'next/image';

import { preloadImages } from '@/shared/lib/preload-next-images';
import { Emoji } from '@/shared/ui/emoji';

import potComplete from '../assets/refund-pot-complete.webp';
import type { HistoryRow } from '../model/reward-history';
import { KST_OFFSET_MS } from '../model/time-left';
import { RefundHistory } from './RefundHistory';

// 하루를 다 채웠을 때 — 실제 내역이 아니라 "이렇게 쌓인다"는 보기다.
// 오늘 날짜로 적어, 지금 시작하면 오늘부터 이렇게 찍힌다는 걸 보여 준다
const sampleOf = (): HistoryRow[] => {
  const today = new Date(Date.now() + KST_OFFSET_MS);
  return [
    {
      id: 'sample-3',
      dateLabel: `${today.getUTCMonth() + 1}.${today.getUTCDate()}`,
      title: '스몰톡 완료',
      note: '21:40',
      amountWon: 111,
      balanceWon: 332,
    },
    {
      id: 'sample-2',
      dateLabel: null,
      title: '표현학습 4개 완료',
      note: '08:31',
      amountWon: 110,
      balanceWon: 221,
    },
    {
      id: 'sample-1',
      dateLabel: null,
      title: '시나리오 대화 완료',
      note: '08:12',
      amountWon: 111,
      balanceWon: 111,
    },
  ];
};

// 쌓이는 건 오늘 것뿐이다 — 지난 시나리오와 그 표현은 다시 해도 쌓이지 않고, 그것만 한 날은 쉰 날로 친다
const RULES = [
  ['💰', '오늘의 시나리오와 그 표현학습, 스몰톡을 끝낼 때마다 쌓여요'],
  ['⚠️', '하루를 통째로 쉬면 쌓인 금액이 0원이 돼요'],
  ['🛡️', '오늘 것을 하나만 해도 쌓인 금액은 지켜져요'],
  ['📘', '지난 시나리오와 표현학습은 다시 해도 쌓이지 않아요'],
  ['📅', '기간을 마치면 한 번에 환급 신청해요'],
] as const;

/** 환급 안내에 들어가기 전에 맨 위 그림을 받아 둔다 — 화면이 열린 뒤에야 받으면 그림 자리가 잠깐 비어 보인다 */
export const preloadRefundGuide = () =>
  preloadImages([
    {
      src: potComplete.src,
      width: potComplete.width,
      height: potComplete.height,
    },
  ]);

export const RefundRuleList = () => (
  <ul className="flex flex-col gap-3">
    {RULES.map(([emoji, text]) => (
      <li
        key={text}
        className="flex items-start gap-2.5 text-[14px] leading-[22px] font-medium break-keep text-foreground"
      >
        {/* 글자 한 줄(22px)의 가운데에 앉힌다 — 두 줄로 넘어가도 첫 줄에 붙어 있다 */}
        <Emoji className="mt-0.5 size-[18px] shrink-0">{emoji}</Emoji>
        {text}
      </li>
    ))}
  </ul>
);

export const RefundGuide = ({
  eyebrow,
  amount,
  caption,
}: {
  // 큰 글자 위 한 줄
  eyebrow: string;
  // 큰 글자 ("최대 59,900원")
  amount: string;
  // 그 아래 한 줄
  caption: string;
}) => (
  <>
    <section className="flex flex-col items-center px-5 pt-4">
      <div className="h-[180px] w-[240px]">
        <Image
          src={potComplete}
          alt=""
          className="size-full object-contain"
          priority
        />
      </div>
      <p className="mt-2 text-[14px] font-bold text-primary">{eyebrow}</p>
      <h2 className="mt-0.5 text-[36px] leading-tight font-black text-foreground">
        {amount}
      </h2>
      <p className="mt-1.5 text-center text-[14px] font-medium text-muted-foreground">
        {caption}
      </p>
    </section>

    <section className="mx-5 mt-4 rounded-[20px] border border-border bg-card px-4 py-4">
      <h3 className="mb-3 text-[15px] font-black text-foreground">환급 규칙</h3>
      <RefundRuleList />
    </section>

    <p className="mt-6 px-5 text-[13px] font-bold text-muted-foreground">
      하루를 다 채우면 이렇게 쌓여요
    </p>
    <div className="mt-3 px-5 opacity-60">
      <RefundHistory history={sampleOf()} />
    </div>
  </>
);
