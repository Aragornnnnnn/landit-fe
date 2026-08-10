'use client';

// 시나리오 카드 — 앞면(썸네일·제목·브리핑·CTA), 완료 시 뒤집으면 뒷면에 표현 학습 리스트
import { useEffect, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import confetti from 'canvas-confetti';

import { track } from '@/shared/analytics';
import { haptic } from '@/shared/haptics';
import { Button } from '@/shared/ui/Button';
import { ArrowRightIcon, LockIcon, ReplayIcon } from '@/shared/ui/Icons';
import { StarRating } from '@/shared/ui/StarRating';

import { expressionStageOf } from '../../lib/expression-progress';
import type { Scenario } from '../../lib/to-scenario';
import { ExpressionProgress } from './ExpressionProgress';
import { ScenarioCardBack } from './ScenarioCardBack';

// 원어민 표현을 전부 깨고 카드로 복귀한 순간의 축하 — ReviewSuccess와 같은 브랜드 색·패턴
const celebrateAllExpressionsDone = () => {
  const colors = ['#e07a3a', '#2f7d54', '#fbbf24', '#ffffff'];
  const base = { spread: 70, startVelocity: 45, ticks: 150, colors };
  confetti({ ...base, particleCount: 55, angle: 60, origin: { x: 0, y: 0.9 } });
  confetti({
    ...base,
    particleCount: 55,
    angle: 120,
    origin: { x: 1, y: 0.9 },
  });
  confetti({
    ...base,
    particleCount: 45,
    spread: 110,
    origin: { x: 0.5, y: 0.6 },
  });
};

interface ScenarioCardProps {
  scenario: Scenario;
  onStart: (scenario: Scenario) => void;
  // 어느 날 카드인지. 뒷면에서 표현 학습으로 들어갈 때 이어 나른다
  date?: string;
  // 홈이 flip 신호로 진입하면(표현 마무리 후 복귀) 마운트 시 자동으로 뒷면을 편다
  autoFlip?: boolean;
  // 완료 카드에 띄우는 표현 학습 진행도
  expressions: { completed: number; total: number };
}

export const ScenarioCard = ({
  scenario,
  onStart,
  date,
  autoFlip = false,
  expressions,
}: ScenarioCardProps) => {
  // 잠금·완료 판정은 전부 백엔드 몫(직전 시나리오를 깨야 다음이 열린다). 카드는 두 플래그를 그리기만 한다.
  // locked   → 흑백 썸네일 + 회색 제목 + "잠겨있어요"
  // completed → 썸네일 우상단 별점 배지 + 표현 학습(뒤집기) / 다시 해볼게요
  const { locked, completed } = scenario;

  // 뒤집기 상태. hasFlipped는 뒷면(표현 API)을 첫 뒤집기 전까지 마운트하지 않기 위한 지연 플래그.
  // autoFlip(표현 마무리 후 홈 복귀)이면 처음부터 뒤집힌 채로 마운트한다.
  const [flipped, setFlipped] = useState(autoFlip && completed);
  const [hasFlipped, setHasFlipped] = useState(autoFlip && completed);
  // completed가 마운트 후 뒤늦게 true가 돼도(캐시가 stale이었던 경우) autoFlip이면 한 번은 자동으로 편다.
  // 렌더 중 state 조정 패턴(effect 아님) — 사용자가 이후 앞면으로 되돌리는 건 막지 않는다.
  const [autoApplied, setAutoApplied] = useState(autoFlip && completed);
  if (autoFlip && completed && !autoApplied) {
    setAutoApplied(true);
    setFlipped(true);
    setHasFlipped(true);
  }

  const filterClass = locked ? 'brightness-70 grayscale' : '';

  // autoFlip으로 처음부터 뒤집힌 채 마운트된 경우도 노출로 기록한다.
  // 이 순간 표현까지 전부 깬 상태(done)면 막 마지막 표현을 끝내고 돌아온 것이므로 축하한다 —
  // 이미 다 깬 카드를 나중에 다시 열 때는 autoFlip이 아니라서 재발동하지 않는다.
  useEffect(() => {
    if (autoFlip && completed) {
      track(EVENTS.SCENARIO_CARD_FLIPPED, {
        scenario_id: scenario.scenarioId,
        direction: 'back',
        trigger: 'auto',
      });
      if (
        expressionStageOf(expressions.completed, expressions.total) === 'done'
      ) {
        celebrateAllExpressionsDone();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 시 1회만
  }, []);

  const openExpressions = () => {
    haptic('medium'); // 완료 카드를 뒤집는 성취 순간엔 좀 더 묵직한 진동
    track(EVENTS.SCENARIO_CARD_FLIPPED, {
      scenario_id: scenario.scenarioId,
      direction: 'back',
      trigger: 'button',
    });
    setHasFlipped(true);
    setFlipped(true);
  };

  const closeExpressions = () => {
    track(EVENTS.SCENARIO_CARD_FLIPPED, {
      scenario_id: scenario.scenarioId,
      direction: 'front',
      trigger: 'button',
    });
    setFlipped(false);
  };

  return (
    <div className="relative h-full w-full [perspective:1600px]">
      {/* 앞/뒤 면을 겹쳐 rotateY로 뒤집는다. preserve-3d 유지 위해 이 요소엔 overflow를 두지 않는다 */}
      <div
        className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? '[transform:rotateY(-180deg)]' : ''
        }`}
      >
        {/* 앞면 */}
        <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl bg-card shadow-md [-webkit-backface-visibility:hidden] [backface-visibility:hidden]">
          {/* 썸네일 — 텍스트 영역을 제외한 카드 전체를 채운다 */}
          <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-foreground">
            {scenario.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- 백엔드 썸네일 도메인이 미정이라 next/image 원격 허용 목록을 아직 못 만든다
              <img
                src={scenario.thumbnailUrl}
                alt={scenario.scenarioTitle}
                // 세로형 썸네일의 얼굴이 위쪽 1/4 부근에 있다 — 가운데 크롭(기본)은 얼굴을 자르고,
                // 맨 위 고정은 아래 행동을 버린다. 15%가 얼굴과 행동을 둘 다 담는 지점(실제 40장 검증)
                className={`h-full w-full object-cover object-[50%_15%] transition-[filter] duration-500 ${filterClass}`}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary">
                <span className="tossface text-6xl">💬</span>
              </div>
            )}

            {/* 완료 시 별점을 썸네일 좌상단에 배지로 띄운다 — 어두운 스크림으로 밝은/어두운 이미지 모두에서 대비 확보 */}
            {completed && (
              <div className="absolute top-3 left-3 rounded-full bg-black/45 px-3 py-2 shadow-sm backdrop-blur-sm">
                <StarRating rating={scenario.starRating ?? 0} size={24} />
              </div>
            )}
          </div>

          {/* 텍스트 + CTA — 완료 카드는 맨 아래가 고스트 버튼이라 하단 패딩을 줄여
              '다시 대화하기' 위아래 여백을 맞춘다 (위: gap 4px+버튼 안 10px = 아래: 안 10px+패딩 4px) */}
          <div
            className={`flex flex-none flex-col gap-2 px-5 pt-3 ${
              !locked && completed ? 'pb-1' : 'pb-5'
            }`}
          >
            <div>
              <p
                className={`text-xl leading-snug font-extrabold ${
                  locked ? 'text-muted-foreground' : 'text-foreground'
                }`}
              >
                {scenario.scenarioTitle}
              </p>
              {scenario.briefing && (
                <p className="mt-1.5 text-sm leading-relaxed font-medium text-muted-foreground">
                  {scenario.briefing}
                </p>
              )}
            </div>

            {locked ? (
              <div className="flex h-14 w-full items-center justify-center gap-1.5 rounded-xl bg-secondary text-base font-bold text-muted-foreground">
                잠겨있어요 <LockIcon size={16} />
              </div>
            ) : completed ? (
              // 완료 카드 — 메인은 표현 학습(뒤집기), 다시 해보기는 아래 고스트로.
              // 할 일이 남았으면 주황, 다 했으면 초록이다 — 남은 일이 눈에 띄어야 한다
              <div className="flex flex-col gap-1">
                <ExpressionProgress
                  completed={expressions.completed}
                  total={expressions.total}
                  onLearn={openExpressions}
                />
                <button
                  type="button"
                  onClick={() => onStart(scenario)}
                  className="flex h-12 w-full items-center justify-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors active:text-foreground"
                >
                  다시 대화하기
                  <ReplayIcon size={15} />
                </button>
              </div>
            ) : (
              <Button onClick={() => onStart(scenario)} variant="primary">
                대화 시작하기
                <ArrowRightIcon size={16} />
              </Button>
            )}
          </div>
        </div>

        {/* 뒷면 — 완료 카드에서 첫 뒤집기 이후에만 마운트(표현 API 지연 호출) */}
        {completed && hasFlipped && (
          <div className="absolute inset-0 flex [transform:rotateY(-180deg)] flex-col overflow-hidden rounded-2xl bg-card shadow-md [-webkit-backface-visibility:hidden] [backface-visibility:hidden]">
            <ScenarioCardBack
              scenarioId={scenario.scenarioId}
              date={date}
              onBack={closeExpressions}
            />
          </div>
        )}
      </div>
    </div>
  );
};
