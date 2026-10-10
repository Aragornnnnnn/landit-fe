'use client';

// 환급 점검 화면(ADMIN) — 케이스 목록을 보여 주고, 고른 케이스(?case=)를 가짜 값으로 연다. 서버도 출시 스위치도 타지 않는다
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuthStore } from '@/shared/auth/auth-store';
import {
  backOrReplace,
  backToMyPage,
  PREMIUM_ONBOARDING_CHECK_PATH,
  premiumOnboardingPath,
  REFUND_CHECK_PATH,
} from '@/shared/lib/routes';
import { BackHeader } from '@/shared/ui/BackHeader';
import { Emoji } from '@/shared/ui/emoji';

import { readCheckCase, type CheckCase } from '../_model/refund-check-cases';
import { MenuLink, MenuSection } from '../../../_ui/Menu';
import { RefundCheckPreview } from './RefundCheckPreview';

// [묶음 제목, [케이스, 이모지, 제목, 설명][]]
const CASE_GROUPS = [
  [
    '환급 화면',
    [
      ['partly', '💰', '쌓는 중 · 오늘 일부', '내역을 세 장 이어 받아요'],
      ['full', '👑', '오늘 다 채움', '세 칸이 모두 받음이에요'],
      ['yet', '⏰', '오늘 아직', '저녁 6시 뒤에 열면 남은 시간이 경고로 떠요'],
      [
        'reset',
        '🥹',
        '어제 쉬어서 0원',
        '내역 맨 위에 연속 학습 끊김이 나와요',
      ],
      ['ended', '🧾', '기간이 끝남', '다시 시작을 누르면 실제 페이월로 가요'],
      ['review', '👀', '결제 내역 확인 중', '오늘 칸 없이 금액만 보여요'],
      ['intro', '👋', '환급 소개', '시작 버튼은 실제 페이월로 가요'],
    ],
  ],
  [
    '내역과 불러오기',
    [
      ['history-fail', '⚠️', '이어 받기 실패', '둘째 장에서 한 번 실패해요'],
      ['history-empty', '📭', '내역 없음', '막 시작한 사람이에요'],
      ['loading', '🧩', '불러오는 중', '스켈레톤을 멈춰서 봐요'],
    ],
  ],
  [
    '받는 순간',
    [
      [
        'coin',
        '🤑',
        '동전 연출',
        '금액을 골라요 · 알약은 실제 환급 화면으로 가요',
      ],
      ['pop', '🔔', '표현 하나마다 알림', '위에서 받은 금액이 떨어져요'],
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
            href={`${REFUND_CHECK_PATH}?case=${name}`}
            icon={<Emoji>{emoji}</Emoji>}
            title={caseTitle}
            description={description}
          />
        ))}
      </MenuSection>
    ))}
    <MenuSection title="결제 직후 안내 — 여기부터는 실제 화면으로 넘어가요">
      <MenuLink
        href={premiumOnboardingPath(PREMIUM_ONBOARDING_CHECK_PATH, 'refund')}
        icon={<Emoji>🎉</Emoji>}
        title="환급 상품을 산 직후"
        description="프리미엄 온보딩 점검의 환급 참여자 케이스로 열어요"
      />
    </MenuSection>
  </>
);

export const RefundCheckScreen = () => {
  const router = useRouter();
  const isAdmin = useAuthStore((state) => state.member?.role === 'ADMIN');
  const name = readCheckCase(useSearchParams().get('case'));

  if (isAdmin && name !== null)
    return (
      <RefundCheckPreview
        // 케이스가 바뀌면 받아 둔 가짜 내역과 연출 상태를 버린다
        key={name}
        name={name}
        // 주소로 바로 들어왔으면 돌아갈 칸이 없다 — 그때는 목록으로 보낸다
        onBack={() => backOrReplace(router, REFUND_CHECK_PATH)}
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
