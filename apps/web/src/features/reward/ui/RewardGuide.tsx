// 환급이 무엇인지 알려 주는 한 덩어리 — 동전 더미 그림, 큰 금액, 규칙 두 줄, 처음 사흘의 보기 내역.
// 결제 전의 환급 소개 화면과 결제 직후(알람 바로 앞) 화면이 같은 모습으로 쓴다
import Image from 'next/image';

import { preloadImages } from '@/shared/lib/preload-next-images';
import { formatWon } from '@/shared/lib/won';
import { Emoji } from '@/shared/ui/emoji';

import potComplete from '../assets/reward-pot-complete.webp';
import { dateLabelAhead, type HistoryRow } from '../model/reward-history';
import { RewardHistory } from './RewardHistory';

// 처음 사흘 — 실제 내역이 아니라 "이렇게 쌓인다"는 보기다. 오늘 시작한 것으로 치고 하루에 한 줄, 늦은 날이 위에 온다
export const SAMPLE_DAYS = 3;
export const sampleHistoryOf = (dailyWon: number): HistoryRow[] =>
  Array.from({ length: SAMPLE_DAYS }, (_, index) => {
    const day = SAMPLE_DAYS - index;
    return {
      id: `sample-${day}`,
      dateLabel: dateLabelAhead(day - 1),
      title: '시나리오 대화 완료',
      note: `${day}일째`,
      amountWon: dailyWon,
      balanceWon: dailyWon * day,
    };
  });

/**
 * 환급 규칙 두 줄 — 환급 화면의 안내 시트, 환급 소개, 결제 직후 안내가 같은 말을 쓴다.
 *
 * @param dailyWon 하루 몫. 아직 모르면(결제 확인 중, 지난 회차만 남음) null — 금액 없이 말한다
 */
export const rewardRulesOf = (dailyWon: number | null) =>
  [
    [
      '💰',
      `매일 오늘의 시나리오를 하면 ${dailyWon === null ? '환급액' : `최대 ${formatWon(dailyWon)}`}이 쌓여요`,
    ],
    ['💸', '기간이 끝나면 모은 돈을 출금할 수 있어요'],
  ] as const;

/** 환급 안내에 들어가기 전에 맨 위 그림을 받아 둔다 — 화면이 열린 뒤에야 받으면 그림 자리가 잠깐 비어 보인다 */
export const preloadRewardGuide = () =>
  preloadImages([
    {
      src: potComplete.src,
      width: potComplete.width,
      height: potComplete.height,
    },
  ]);

export const RewardRuleList = ({ dailyWon }: { dailyWon: number | null }) => (
  <ul className="flex flex-col gap-3">
    {rewardRulesOf(dailyWon).map(([emoji, text]) => (
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

export const RewardGuide = ({
  eyebrow,
  amount,
  caption,
  dailyWon,
  rulesInHeader = false,
}: {
  // 큰 글자 위 한 줄
  eyebrow: string;
  // 큰 글자 ("500원")
  amount: string;
  // 그 아래 한 줄 — 낱말을 띄우거나 규칙 줄을 넣을 수 있게 요소로 받는다
  caption: React.ReactNode;
  // 하루 몫 — 규칙과 보기 내역이 이 금액으로 말한다. 아직 모르면 null이고 보기 내역은 그리지 않는다
  dailyWon: number | null;
  // 규칙을 헤더의 안내 버튼이 여는 화면 — 본문에는 규칙 카드를 그리지 않는다
  rulesInHeader?: boolean;
}) => (
  <>
    <section className="flex flex-col items-center px-5 pt-2">
      {/* 그림은 낮게 — 작은 폰에서도 규칙 카드 아래 "매일 이렇게 쌓여요"가 첫 화면에 걸려야 더 있는 줄 안다 */}
      <div className="h-[132px] w-[176px]">
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
      <div className="mt-1.5 text-center text-[14px] font-medium text-muted-foreground">
        {caption}
      </div>
    </section>

    {!rulesInHeader && (
      <section className="mx-5 mt-4 rounded-[20px] border border-border bg-card px-4 py-4">
        <h3 className="mb-3 text-[15px] font-black text-foreground">
          환급 규칙
        </h3>
        <RewardRuleList dailyWon={dailyWon} />
      </section>
    )}

    {dailyWon !== null && (
      <>
        <p className="mt-6 px-5 text-[13px] font-bold text-muted-foreground">
          매일 이렇게 쌓여요
        </p>
        <div className="mt-3 px-5 opacity-60">
          <RewardHistory history={sampleHistoryOf(dailyWon)} />
        </div>
      </>
    )}
  </>
);
