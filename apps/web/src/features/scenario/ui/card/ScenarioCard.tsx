'use client';

// 시나리오 카드 — 앞면(썸네일·제목·브리핑·CTA, 완료 시 기록 버튼), 완료 시 뒤집으면 뒷면에 표현 학습 리스트.
// 뒤집기는 페이월 문이 아니다 — 무료 사용자도 뒷면을 보고, 막는 건 뒷면의 표현이다. 첫 표현 투어 중에는 카드가 스스로 뒤집힌다
import { useEffect, useEffectEvent, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import Link from 'next/link';

import { track } from '@/shared/analytics';
import { haptic } from '@/shared/haptics';
import { scenarioSessionsPath } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { Emoji } from '@/shared/ui/emoji';
import {
  ArrowRightIcon,
  ChevronRightIcon,
  LockIcon,
  ReplayIcon,
} from '@/shared/ui/Icons';
import { StarRating } from '@/shared/ui/StarRating';

import type { Scenario } from '../../lib/to-scenario';
import { ExpressionProgress } from './ExpressionProgress';
import { ScenarioCardBack } from './ScenarioCardBack';

// 튜토리얼 어둠이 걷히는 걸 본 뒤에 뒤집는다
const TOUR_FLIP_DELAY_MS = 500;

interface ScenarioCardProps {
  scenario: Scenario;
  onStart: (scenario: Scenario) => void;
  // 어느 날 카드인지. 뒷면에서 표현 학습으로 들어갈 때 이어 나른다
  date?: string;
  // 홈이 flip 신호로 진입하면(표현 마무리 후 복귀) 마운트 시 자동으로 뒷면을 편다
  autoFlip?: boolean;
  // 완료 카드에 띄우는 표현 학습 진행도
  expressions: { completed: number; total: number };
  // 첫 표현 투어의 차례 — flip_card은 스스로 뒤집기, free_expression은 뒷면 첫 표현 무료
  tour?: CardTour;
}

export interface CardTour {
  screen: 'flip_card' | 'free_expression';
  // 카드가 스스로 뒤집혔다
  onFlipped: () => void;
  // 투어를 여기서 끝낸다 — 줄 무료 표현이 없거나 사용자가 넘겼다
  onTourEnd: () => void;
}

export const ScenarioCard = ({
  scenario,
  onStart,
  date,
  autoFlip = false,
  expressions,
  tour,
}: ScenarioCardProps) => {
  // 잠금·완료 판정은 전부 백엔드 몫(직전 시나리오를 깨야 다음이 열린다). 카드는 두 플래그를 그리기만 한다.
  // locked   → 흑백 썸네일 + 회색 제목 + "잠겨있어요"
  // completed → 썸네일 우상단 별점 배지 + 표현 학습(뒤집기) / 다시 해볼게요
  const { locked, completed } = scenario;

  // 뒤집기 상태. hasFlipped는 뒷면(표현 API)을 첫 뒤집기 전까지 마운트하지 않기 위한 지연 플래그.
  // autoFlip(표현 마무리 후 홈 복귀)이면 처음부터 뒤집힌 채로 마운트한다.
  // 뒷면으로 펴 둔 채 시작하는가 — 표현을 마치고 돌아왔거나, 투어의 무료 표현 차례다
  const openBack =
    (autoFlip || tour?.screen === 'free_expression') && completed;
  const [flipped, setFlipped] = useState(openBack);
  const [hasFlipped, setHasFlipped] = useState(openBack);
  // completed가 마운트 후 뒤늦게 true가 돼도(캐시가 stale이었던 경우) autoFlip이면 한 번은 자동으로 편다.
  // 렌더 중 state 조정 패턴(effect 아님) — 사용자가 이후 앞면으로 되돌리는 건 막지 않는다.
  const [autoApplied, setAutoApplied] = useState(openBack);
  if (openBack && !autoApplied) {
    setAutoApplied(true);
    setFlipped(true);
    setHasFlipped(true);
  }

  const filterClass = locked ? 'brightness-70 grayscale' : '';
  // 등장 연출은 마운트 때 한 번 정한다 — 뒷면으로 펴지며 마운트되면 건너뛰고, 나중에 flip 신호가 빠져도 뒷면 아래서 다시 돌지 않게(iOS에서 비친다)
  const [cardInClass] = useState(openBack ? '' : 'animate-card-in');

  // autoFlip으로 처음부터 뒤집힌 채 마운트된 경우도 노출로 기록한다
  useEffect(() => {
    if (autoFlip && completed) {
      track(EVENTS.SCENARIO_CARD_FLIPPED, {
        scenario_id: scenario.scenarioId,
        direction: 'back',
        trigger: 'auto',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 시 1회만
  }, []);

  const flipToBack = (trigger: 'button' | 'auto') => {
    haptic('medium'); // 완료 카드를 뒤집는 성취 순간엔 좀 더 묵직한 진동
    track(EVENTS.SCENARIO_CARD_FLIPPED, {
      scenario_id: scenario.scenarioId,
      direction: 'back',
      trigger,
    });
    setHasFlipped(true);
    setFlipped(true);
    // 투어의 뒤집기 차례면 어느 길로 뒤집었든 단계를 넘긴다 — 자동 뒤집기 전에 사용자가 먼저 누를 수 있다
    if (tour?.screen === 'flip_card') tour.onFlipped();
  };
  const openExpressions = () => flipToBack('button');
  // 투어는 튜토리얼이 걷히고 잠깐 뒤 카드를 스스로 뒤집는다 — 누를 것 없이 첫 표현으로 이어진다
  const autoFlipping = tour?.screen === 'flip_card' && completed && !flipped;
  const flipForTour = useEffectEvent(() => flipToBack('auto'));
  useEffect(() => {
    if (!autoFlipping) return;
    const timer = setTimeout(flipForTour, TOUR_FLIP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [autoFlipping]);

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
        {/* 앞면 — 사진·제목 자리를 바꾸면 ScenarioCardSkeleton도 같이 맞춘다 */}
        <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl bg-card shadow-md [-webkit-backface-visibility:hidden] [backface-visibility:hidden]">
          {/* 썸네일 — 텍스트 영역을 제외한 카드 전체를 채운다 */}
          <div
            className={`relative min-h-0 w-full flex-1 overflow-hidden bg-foreground ${cardInClass}`}
            style={{ '--i': 0 } as React.CSSProperties}
          >
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
                <Emoji className="text-6xl">💬</Emoji>
              </div>
            )}

            {/* 완료 시 별점을 썸네일 좌상단에 배지로 띄운다 — 어두운 스크림으로 밝은/어두운 이미지 모두에서 대비 확보.
              뒤집힌 동안에는 그리지 않는다 — iOS(WebKit)에서 backdrop-filter 레이어가 backface-visibility를
              무시하고 뒷면 위에 잔상으로 남는다 */}
            {completed && !flipped && (
              <div className="absolute top-3 left-3 rounded-full bg-black/45 px-3 py-2 shadow-sm backdrop-blur-sm">
                <StarRating rating={scenario.starRating ?? 0} size={24} />
              </div>
            )}
            {/* 완료한 시나리오는 지난 회차를 다시 볼 수 있다 — 어두운 별점 배지와 갈리게 밝은 알약에 스몰톡과 같은 「기록 ›」.
              세로 중심은 별점 배지(top-3·h-10)와 맞추고, 별점 배지와 같은 이유로 뒤집힌 동안에는 그리지 않는다 */}
            {completed && !flipped && (
              <Link
                href={scenarioSessionsPath(scenario.scenarioId, date)}
                aria-label="대화 기록"
                className="absolute top-[15px] right-3 flex h-[34px] items-center gap-0.5 rounded-full bg-white/90 pr-2.5 pl-3 text-[13px] font-semibold text-foreground shadow-sm backdrop-blur-sm active:opacity-70"
              >
                기록
                <ChevronRightIcon size={14} />
              </Link>
            )}
          </div>

          {/* 텍스트 + CTA — 완료 카드는 맨 아래가 고스트 버튼이라 하단 패딩을 줄여
              '다시 대화하기' 위아래 여백을 맞춘다 (위: gap 4px+버튼 안 10px = 아래: 안 10px+패딩 4px) */}
          <div
            className={`flex flex-none flex-col gap-2 px-5 pt-3 ${
              !locked && completed ? 'pb-1' : 'pb-5'
            }`}
          >
            <div
              className={cardInClass}
              style={{ '--i': 1 } as React.CSSProperties}
            >
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
              <div
                className={`flex h-14 w-full items-center justify-center gap-1.5 rounded-xl bg-secondary text-base font-bold text-muted-foreground ${cardInClass}`}
                style={{ '--i': 2 } as React.CSSProperties}
              >
                잠겨있어요 <LockIcon size={16} />
              </div>
            ) : completed ? (
              // 완료 카드 — 메인은 표현 학습(뒤집기), 다시 해보기는 아래 고스트로.
              // 할 일이 남았으면 주황, 다 했으면 초록이다 — 남은 일이 눈에 띄어야 한다
              <div
                className={`flex flex-col gap-1 ${cardInClass}`}
                style={{ '--i': 2 } as React.CSSProperties}
              >
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
              autoFlip={autoFlip}
              freeTour={tour !== undefined}
              onTourEnd={tour?.onTourEnd}
            />
          </div>
        )}
      </div>
    </div>
  );
};
