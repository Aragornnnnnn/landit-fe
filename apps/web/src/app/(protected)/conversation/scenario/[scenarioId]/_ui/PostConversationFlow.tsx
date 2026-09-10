'use client';

// 대화 직후, 무료 사용자가 페이월 전에 지나는 화면들 — 분석 대기 → (쓸 만한 결과면) 레벨 결과 → 학습 준비.
// 신규·기존을 가리지 않고 같은 순서다. 끝나면 onFinish로 표현 분기(또는 페이월)로 넘긴다
import { useState } from 'react';

import { useExpressionsQuery } from '@/features/expression/model/useExpressionsQuery';
import type { UsableAssessment } from '@/features/feedback/model/level-assessment';
import { Transition } from '@/shared/motion';

import { AnalyzingScreen } from './AnalyzingScreen';
import { LevelResultScreen } from './LevelResultScreen';
import { PreparedLearningScreen } from './PreparedLearningScreen';

type Screen =
  | { name: 'analyzing' }
  | { name: 'level'; assessment: UsableAssessment }
  | { name: 'prepared' };

interface PostConversationFlowProps {
  sessionId: number | null;
  scenarioId: number;
  /** 학습 준비 화면의 CTA — 표현 분기로, 무료 사용자는 그 자리에서 페이월로 */
  onFinish: () => void;
}

export const PostConversationFlow = ({
  sessionId,
  scenarioId,
  onFinish,
}: PostConversationFlowProps) => {
  const [screen, setScreen] = useState<Screen>({ name: 'analyzing' });
  // 학습 준비 화면이 쓸 표현 개수를 분석 중에 미리 받아 둔다 — 그 화면에서 숫자가 바뀌어 보이지 않게
  useExpressionsQuery(scenarioId);

  if (screen.name === 'analyzing') {
    return (
      <Transition transitionKey="analyzing" fade>
        <AnalyzingScreen
          sessionId={sessionId}
          onDone={(assessment) =>
            setScreen(
              assessment ? { name: 'level', assessment } : { name: 'prepared' },
            )
          }
        />
      </Transition>
    );
  }
  if (screen.name === 'level') {
    return (
      <Transition transitionKey="level" fade>
        <LevelResultScreen
          scenarioId={scenarioId}
          assessment={screen.assessment}
          onContinue={() => setScreen({ name: 'prepared' })}
        />
      </Transition>
    );
  }
  return (
    <Transition transitionKey="prepared" fade>
      <PreparedLearningScreen scenarioId={scenarioId} onContinue={onFinish} />
    </Transition>
  );
};
