'use client';

// 투어 점검 화면(ADMIN) — 첫 대화 직후의 레벨 결과부터, 또는 홈 투어(튜토리얼 → 카드 뒤집기 → 무료 표현)의 단계를 골라 이 계정으로 다시 본다.
// 고르면 투어 단계를 그 자리로 돌리고 이번 실행 동안 무료 판정을 넘기는 미리보기를 켠 뒤 홈으로 간다
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 가로 import 사유: 첫 대화 직후 화면을 대화 피드백 라우트의 것 그대로 보여 준다
import { LevelResultScreen } from '@/app/(protected)/conversation/scenario/[scenarioId]/feedback/_ui/LevelResultScreen';
import type { UsableAssessment } from '@/features/feedback/model/level-assessment';
import { markMissedEarn } from '@/features/reward/model/missed-earn';
import { startTourPreview } from '@/features/tour/model/tour-preview';
import type { TourStep } from '@/features/tour/model/tour-step';
import { useAuthStore } from '@/shared/auth/auth-store';
import { useIsAdmin } from '@/shared/auth/current-member';
import { backToMyPage, SCENARIO_PATH } from '@/shared/lib/routes';
import { BackHeader } from '@/shared/ui/BackHeader';
import { Emoji } from '@/shared/ui/emoji';

import { MenuButton, MenuLink, MenuSection } from '../../../_ui/Menu';

// 가짜 레벨 결과는 실제 시나리오에서 온 게 아니다 — 노출 이벤트의 시나리오 칸에 0을 넣는다
const PREVIEW_SCENARIO_ID = 0;

// 레벨 결과에 띄울 가짜 평가 — 첫 대화로 3단계가 나온 사람
const domain = (score: number) => ({ score, confidence: 0.9 });
const SAMPLE_ASSESSMENT: UsableAssessment = {
  situationPerformance: domain(4.1),
  grammar: domain(2.7),
  vocabulary: domain(3.55),
  discourse: domain(3.3),
  interactionPragmatics: domain(2.9),
  assessedScore: 3.4,
  assessedLevel: 3,
  sufficientEvidence: true,
  source: 'MODEL',
  changeType: 'INITIALIZED',
  previousLevel: null,
  currentLevel: 3,
  displayLevel: 3,
  details: null,
  assessmentVersion: 'v1',
};

// 홈 투어의 단계 — 고르면 lastDone까지 끝낸 것으로 두고 그다음 화면부터 본다
const HOME_STEPS: { title: string; lastDone: TourStep; description: string }[] =
  [
    {
      title: '튜토리얼부터',
      lastDone: 'STARTED',
      description: '동전이 알약으로 쌓이는 연출과 래디의 타이핑 문장부터',
    },
    {
      title: '카드 뒤집기부터',
      lastDone: 'TUTORIAL_DONE',
      description: '오늘 카드를 뒤집어 보라는 안내부터',
    },
    {
      title: '무료 표현부터',
      lastDone: 'CARD_FLIPPED',
      description: '카드 뒷면의 무료 표현 하나를 여는 자리부터',
    },
  ];

// 목록으로 알 수 없는 것 — [궁금한 것, 답]
const NOTES = [
  [
    '카드 뒤집기·무료 표현이 안 떠요',
    '오늘 카드를 끝낸 날에만 이어져요. 오늘 시나리오를 먼저 끝내 주세요',
  ],
  [
    '레벨 결과는 무엇으로 그리나요',
    '3단계가 나온 가짜 평가예요. 버튼을 누르면 홈 튜토리얼로 이어져요',
  ],
  ['무료 표현을 끝내면', '실제처럼 페이월로 가요'],
  ['미리보기는 언제 꺼지나요', '앱을 다시 열면 꺼져요'],
] as const;

export const TourCheckScreen = () => {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const [showLevel, setShowLevel] = useState(false);

  const start = (lastDone: TourStep) => {
    if (userId === null) return;
    startTourPreview(userId, lastDone);
    // 튜토리얼 앞에는 오늘 시나리오를 막 끝내고 돌아온 순간의 동전 연출이 있다 — 그 자리부터 볼 때만 같이 켠다
    if (lastDone === 'STARTED') markMissedEarn(userId);
  };

  if (isAdmin && showLevel) {
    return (
      <LevelResultScreen
        scenarioId={PREVIEW_SCENARIO_ID}
        assessment={SAMPLE_ASSESSMENT}
        ctaLabel="랜딧으로 영어 공부 시작하기"
        onContinue={() => {
          start('STARTED');
          router.push(SCENARIO_PATH);
        }}
      />
    );
  }

  return (
    <main className="flex h-dvh flex-col bg-muted">
      <BackHeader title="투어 점검" onBack={() => backToMyPage(router)} />

      <div className="flex-1 overflow-y-auto pb-(--safe-area-inset-bottom)">
        <div className="space-y-5 px-4 pt-3 pb-10">
          {isAdmin ? (
            <>
              <MenuSection title="첫 대화 직후">
                <MenuButton
                  icon={<Emoji>🎓</Emoji>}
                  title="레벨 결과부터"
                  onClick={() => setShowLevel(true)}
                />
              </MenuSection>

              <MenuSection title="홈 투어 — 단계를 골라서">
                {HOME_STEPS.map(({ title, lastDone, description }) => (
                  <MenuLink
                    key={lastDone}
                    href={SCENARIO_PATH}
                    onClick={() => start(lastDone)}
                    icon={<Emoji>👋</Emoji>}
                    title={title}
                    description={description}
                  />
                ))}
              </MenuSection>

              <MenuSection title="참고">
                <dl className="space-y-3 px-4 py-4">
                  {NOTES.map(([question, answer]) => (
                    <div key={question}>
                      <dt className="text-[14px] font-bold text-foreground">
                        {question}
                      </dt>
                      <dd className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                        {answer}
                      </dd>
                    </div>
                  ))}
                </dl>
              </MenuSection>
            </>
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
