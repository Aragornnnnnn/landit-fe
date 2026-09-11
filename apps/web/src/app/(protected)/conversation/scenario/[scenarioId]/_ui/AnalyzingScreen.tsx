'use client';

// 대화 직후 레벨 분석 대기 — BE가 세션 수준 평가를 마칠 때까지 기다리고, 쓸 수 있는 결과면 넘기고 아니면 빈손으로 넘긴다.
// 기다림은 발음 평가와 같은 래디 서사(듣기→비교→검토→정리)로 채운다. 상한을 두는 이유는 이 화면 뒤가 페이월이라서다
import { useEffect, useEffectEvent, useRef } from 'react';

// 가로 import 사유: 같은 대기 연출을 두 벌 두지 않는다 — 문구만 레벨 분석용으로 바꿔 쓴다
import {
  AnalyzingLandy,
  type AnalyzingStage,
} from '@/features/expression/ui/pronunciation/AnalyzingLandy';
import {
  isUsableAssessment,
  type UsableAssessment,
} from '@/features/feedback/model/level-assessment';
import { useLevelAssessmentQuery } from '@/features/feedback/model/useLevelAssessmentQuery';

// 이 시간 안에 결과가 안 오면 레벨 화면 없이 진행한다 (BE 자체 만료는 120초)
const ANALYSIS_WAIT_MS = 20_000;

const LEVEL_STAGES: AnalyzingStage[] = [
  {
    image: '/images/character/landy-loading-01-listening.webp',
    text: '방금 대화를 다시 듣고 있어요',
  },
  {
    image: '/images/character/landy-loading-02-compare-orb.webp',
    text: '원어민 표현과 비교하고 있어요',
  },
  {
    image: '/images/character/landy-loading-03-review.webp',
    text: '영역별로 꼼꼼히 살펴보고 있어요',
  },
  {
    image: '/images/character/landy-loading-04-finalize.webp',
    text: '레벨과 학습지를 정리하고 있어요',
  },
];

interface AnalyzingScreenProps {
  sessionId: number | null;
  /** 결과가 쓸 만하면 그 결과를, 아니면(실패·근거 부족·시간 초과) null을 준다. 한 번만 부른다 */
  onDone: (assessment: UsableAssessment | null) => void;
}

/** 보이는 부분만 — 데이터가 없어 미리보기에서도 그대로 쓴다 */
export const AnalyzingView = () => (
  <main
    className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background px-6"
    style={{ paddingTop: 'calc(max(env(safe-area-inset-top), 18px) + 58px)' }}
  >
    <h1 className="text-[26px] leading-[1.3] font-black break-keep">
      방금 대화를 바탕으로
      <br />
      레벨을 분석하고 있어요
    </h1>
    <div className="flex flex-1 items-center justify-center pb-24">
      <AnalyzingLandy stages={LEVEL_STAGES} />
    </div>
  </main>
);

export const AnalyzingScreen = ({
  sessionId,
  onDone,
}: AnalyzingScreenProps) => {
  const { outcome, levelAssessment } = useLevelAssessmentQuery(sessionId);
  // 한 번만 넘긴다 — 결과를 넘긴 뒤에도 화면 전환이 끝날 때까지 이 화면이 잠깐 남아 있어 제한 시간 타이머가 뒤따라 울 수 있다.
  // 부모의 화면 전환 함수는 매 렌더 새로 만들어진다 — 이벤트로 감싸 effect가 그것 때문에 다시 돌지 않게 한다
  const settled = useRef(false);
  const finish = useEffectEvent((assessment: UsableAssessment | null) => {
    if (settled.current) return;
    settled.current = true;
    onDone(assessment);
  });

  useEffect(() => {
    if (outcome === 'pending') return;
    finish(
      outcome === 'ready' && isUsableAssessment(levelAssessment)
        ? levelAssessment
        : null,
    );
  }, [outcome, levelAssessment]);

  useEffect(() => {
    const timer = setTimeout(() => finish(null), ANALYSIS_WAIT_MS);
    return () => clearTimeout(timer);
  }, []);

  return <AnalyzingView />;
};
