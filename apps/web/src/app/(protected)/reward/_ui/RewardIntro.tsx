'use client';

// 환급을 아직 시작하지 않은 사람이 보는 환급 화면 — 무엇을 하면 얼마를 돌려받는지 보여 주고 페이월로 보낸다.
// 오늘의 시나리오를 이미 했으면 금액 아래 한 줄만 바뀐다 (reward-intro-copy)
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { RewardGuide, rewardRulesOf } from '@/features/reward/ui/RewardGuide';
import { track } from '@/shared/analytics';
import { paywallPath, REWARD_PATH } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { Emoji } from '@/shared/ui/emoji';

import type { RewardIntroCopy } from '../_model/reward-intro-copy';
import { EmphasizedText } from './EmphasizedText';

export const RewardIntro = ({
  copy,
  dailyWon,
}: {
  copy: RewardIntroCopy;
  dailyWon: number;
}) => (
  <div className="pb-8">
    <RewardGuide
      eyebrow={copy.eyebrow}
      amount={copy.amount}
      caption={
        copy.caption ? (
          <EmphasizedText line={copy.caption} />
        ) : (
          <RuleLines dailyWon={dailyWon} />
        )
      }
      dailyWon={dailyWon}
      rulesInHeader
    />
  </div>
);

// 헤더 안내 버튼이 여는 규칙을 금액 바로 아래에도 적는다 — 처음 보는 사람은 버튼을 누르기 전에 규칙부터 읽어야 한다
const RuleLines = ({ dailyWon }: { dailyWon: number }) => (
  // 두 줄을 한 덩어리로 가운데 두고 안에서는 왼쪽에 맞춘다 — 줄마다 가운데면 이모지가 들쭉날쭉하다
  <ul className="mt-2 inline-flex flex-col items-start gap-2 text-left">
    {rewardRulesOf(dailyWon).map(([emoji, text]) => (
      <li key={text} className="flex items-center gap-2 break-keep">
        <Emoji className="size-4 shrink-0">{emoji}</Emoji>
        {text}
      </li>
    ))}
  </ul>
);

// 아래 고정 버튼 — 환급을 시작하려면 결제부터다
export const RewardStartButton = ({ label }: { label: string }) => {
  const router = useRouter();

  return (
    <Button
      onClick={() => {
        track(EVENTS.PAYWALL_ENTRY_TAPPED, { source: 'reward' });
        // 결제하고 돌아오면 이 화면이 다시 열린다 — 기록에 같은 화면이 두 번 쌓이지 않게 갈아 끼운다
        router.replace(paywallPath({ source: 'reward', from: REWARD_PATH }));
      }}
    >
      {label}
    </Button>
  );
};
