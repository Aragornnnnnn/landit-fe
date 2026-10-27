'use client';

// 대화 직후, 무료 사용자가 페이월 전에 지나는 화면들 — 분석 대기 → (쓸 만한 결과면) 레벨 결과 → 학습 준비.
// 신규·기존을 가리지 않고 같은 순서다. 끝나면 onFinish로 표현 분기(또는 페이월)로 넘긴다.
// 프리미엄 프리뷰를 시작하는 사람은 학습 준비 없이 레벨까지만 보고 onPreviewStart으로 홈에 간다
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

// 가로 import 사유: 대화 뒤 이어지는 환급 페이월의 첫 화면 그림을 미리 받는다
import { SCENARIO_WALL_IMAGES } from '@/app/(protected)/paywall/_model/paywall-content';
import { useExpressionsQuery } from '@/features/expression/model/useExpressionsQuery';
import {
  LEVEL_IMAGES,
  type UsableAssessment,
} from '@/features/feedback/model/level-assessment';
import { PAYWALL_HERO } from '@/features/subscription/ui/paywall-hero-image';
import { preloadImages } from '@/shared/lib/preload-next-images';
import { Transition } from '@/shared/motion';

import { AnalyzingScreen } from './AnalyzingScreen';
import { LevelResultScreen } from './LevelResultScreen';
import { PreparedLearningScreen, SLIDE_IMAGES } from './PreparedLearningScreen';

type Screen =
  | { name: 'analyzing' }
  | { name: 'level'; assessment: UsableAssessment }
  | { name: 'prepared' };

interface PostConversationFlowProps {
  sessionId: number | null;
  scenarioId: number;
  /** 학습 준비 화면의 CTA — 표현 분기로, 무료 사용자는 그 자리에서 페이월로 */
  onFinish: () => void;
  /** 주면 프리미엄 프리뷰를 시작한다 — 레벨(쓸 만한 결과가 없으면 분석)까지만 보고 학습 준비 대신 이걸 부른다 */
  onPreviewStart?: () => void;
}

export const PostConversationFlow = ({
  sessionId,
  scenarioId,
  onFinish,
  onPreviewStart,
}: PostConversationFlowProps) => {
  const t = useTranslations('conversation.postConversationFlow');
  const [screen, setScreen] = useState<Screen>({ name: 'analyzing' });
  // 학습 준비 화면이 쓸 표현 개수를 분석 중에 미리 받아 둔다 — 그 화면에서 숫자가 바뀌어 보이지 않게
  useExpressionsQuery(scenarioId);
  // 뒤 화면의 그림도 분석 중에 미리 받는다 — 레벨 마법사 다섯, 장면 래디, 페이월 히어로와 환급 페이월 카드 벽. 장면이 넘어가거나 페이월이 뜰 때 빈 자리가 안 보이게
  useEffect(() => {
    preloadImages([
      ...Object.values(LEVEL_IMAGES),
      ...SLIDE_IMAGES,
      PAYWALL_HERO,
      ...SCENARIO_WALL_IMAGES,
    ]);
  }, []);

  if (screen.name === 'analyzing') {
    return (
      <Transition transitionKey="analyzing" fade>
        <AnalyzingScreen
          sessionId={sessionId}
          onDone={(assessment) => {
            if (assessment) setScreen({ name: 'level', assessment });
            else if (onPreviewStart) onPreviewStart();
            else setScreen({ name: 'prepared' });
          }}
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
          onContinue={onPreviewStart ?? (() => setScreen({ name: 'prepared' }))}
          ctaLabel={onPreviewStart ? t('previewStartButton') : undefined}
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
