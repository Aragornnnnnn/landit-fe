'use client';

// 대화 직후, 무료 사용자가 페이월 전에 지나는 화면들 — 분석 대기 → (쓸 만한 결과면) 레벨 결과 → 학습 준비.
// 어디서 시작할지는 post-feedback-view가 정하고 여기서는 순서만 진행한다. 끝나면 onFinish로 표현 분기(또는 페이월)로 넘긴다
import { useState } from 'react';

import type { UsableAssessment } from '@/features/feedback/model/level-assessment';
import { Transition } from '@/shared/motion';

import type { PostConversationStart } from '../_model/post-feedback-view';
import { AnalyzingScreen } from './AnalyzingScreen';
import { LevelResultScreen } from './LevelResultScreen';
import { PreparedLearningScreen } from './PreparedLearningScreen';

type Screen =
  | { name: 'analyzing' }
  | { name: 'level'; assessment: UsableAssessment }
  | { name: 'prepared' };

interface PostConversationFlowProps {
  start: PostConversationStart;
  sessionId: number | null;
  scenarioId: number;
  /** 학습 준비 화면의 CTA — 표현 분기로, 무료 사용자는 그 자리에서 페이월로 */
  onFinish: () => void;
}

export const PostConversationFlow = ({
  start,
  sessionId,
  scenarioId,
  onFinish,
}: PostConversationFlowProps) => {
  const [screen, setScreen] = useState<Screen>(
    start === 'analyzing' ? { name: 'analyzing' } : { name: 'prepared' },
  );

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
