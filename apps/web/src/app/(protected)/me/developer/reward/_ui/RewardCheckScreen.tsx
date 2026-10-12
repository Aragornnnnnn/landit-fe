'use client';

// 환급 점검 화면(ADMIN) — 케이스 목록을 보여 주고, 고른 케이스(?case=)를 가짜 값으로 연다. 서버도 출시 스위치도 타지 않는다
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuthStore } from '@/shared/auth/auth-store';
import {
  backOrReplace,
  backToMyPage,
  PREMIUM_ONBOARDING_CHECK_PATH,
  premiumOnboardingPath,
  REWARD_CHECK_PATH,
} from '@/shared/lib/routes';
import { BackHeader } from '@/shared/ui/BackHeader';
import { Emoji } from '@/shared/ui/emoji';

import { readCheckCase, type CheckCase } from '../_model/reward-check-cases';
import { MenuLink, MenuSection } from '../../../_ui/Menu';
import { RewardCheckPreview } from './RewardCheckPreview';

// [묶음 제목, [케이스, 이모지, 제목, 설명][]]
const CASE_GROUPS = [
  [
    '환급 화면',
    [
      ['yet', '⏰', '오늘 아직', '쌓인 금액은 그대로고 잠자는 래디가 보여요'],
      ['kept', '💰', '오늘 받음', '내역을 세 장 이어 받아요'],
      ['first', '📭', '첫날 0원', '빈 통에 내역이 한 줄도 없어요'],
      ['ended', '🧾', '기간 끝 · 출금 가능', '버튼에 출금할 금액이 적혀요'],
      ['pending', '🔔', '결제 확인 중', '금액 없이 확인 중이라고만 말해요'],
      ['review', '👀', '검토 중', '오늘 안내 없이 금액만 보여요'],
      [
        'intro',
        '👋',
        '환급 소개 · 오늘 대화 전',
        '시작 버튼은 실제 페이월로 가요',
      ],
      [
        'introTalked',
        '👋',
        '환급 소개 · 오늘 대화 후',
        '오늘의 시나리오를 끝낸 무료 사용자',
      ],
    ],
  ],
  [
    '내역과 불러오기',
    [
      ['history-fail', '⚠️', '이어 받기 실패', '둘째 장에서 한 번 실패해요'],
      ['loading', '🧩', '불러오는 중', '스켈레톤을 멈춰서 봐요'],
    ],
  ],
  [
    '받는 순간',
    [
      ['coin', '🤑', '동전 연출', '알약은 실제 환급 화면으로 가요'],
      ['earned', '💸', '시나리오를 끝낸 순간', '열매 대신 받은 금액이 떠요'],
    ],
  ],
] as const satisfies readonly (readonly [
  string,
  readonly (readonly [CheckCase, string, string, string])[],
])[];

const CaseList = () => (
  <>
    {CASE_GROUPS.map(([title, cases]) => (
      <MenuSection key={title} title={title}>
        {cases.map(([name, emoji, caseTitle, description]) => (
          <MenuLink
            key={name}
            href={`${REWARD_CHECK_PATH}?case=${name}`}
            icon={<Emoji>{emoji}</Emoji>}
            title={caseTitle}
            description={description}
          />
        ))}
      </MenuSection>
    ))}
    <MenuSection title="결제 직후 안내 — 여기부터는 실제 화면으로 넘어가요">
      <MenuLink
        href={premiumOnboardingPath(PREMIUM_ONBOARDING_CHECK_PATH, 'reward')}
        icon={<Emoji>🎉</Emoji>}
        title="환급 상품을 산 직후"
        description="프리미엄 온보딩 점검의 환급 참여자 케이스로 열어요"
      />
    </MenuSection>
  </>
);

export const RewardCheckScreen = () => {
  const router = useRouter();
  const isAdmin = useAuthStore((state) => state.member?.role === 'ADMIN');
  const name = readCheckCase(useSearchParams().get('case'));

  if (isAdmin && name !== null)
    return (
      <RewardCheckPreview
        // 케이스가 바뀌면 받아 둔 가짜 내역과 연출 상태를 버린다
        key={name}
        name={name}
        // 주소로 바로 들어왔으면 돌아갈 칸이 없다 — 그때는 목록으로 보낸다
        onBack={() => backOrReplace(router, REWARD_CHECK_PATH)}
      />
    );

  return (
    <main className="flex h-dvh flex-col bg-muted">
      <BackHeader title="환급 점검" onBack={() => backToMyPage(router)} />

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 px-4 pt-3 pb-10">
          {isAdmin ? (
            <CaseList />
          ) : (
            <p className="rounded-xl bg-card px-4 py-4 text-sm text-muted-foreground">
              ADMIN 계정에서만 볼 수 있어요
            </p>
          )}
        </div>
      </div>
    </main>
  );
};
