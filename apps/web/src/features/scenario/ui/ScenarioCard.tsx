'use client';

// 시나리오 카드 — 썸네일·제목·브리핑과 상태(난이도·완료·잠금), 시작 CTA
import type { Scenario } from '@/api/scenarios/list';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon, LockIcon } from '@/components/ui/Icons';
import { StarRating } from '@/components/ui/StarRating';

interface ScenarioCardProps {
  scenario: Scenario;
  onStart: (scenario: Scenario) => void;
}

export const ScenarioCard = ({ scenario, onStart }: ScenarioCardProps) => {
  // 잠금·완료 판정은 전부 백엔드 몫(직전 시나리오를 깨야 다음이 열린다). 카드는 두 플래그를 그리기만 한다.
  // locked   → 흑백 썸네일 + 회색 제목 + "잠겨있어요"
  // completed → 제목 옆 별점 + "다시 해볼게요"
  const { locked, completed } = scenario;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-card shadow-md">
      {/* 썸네일 — 텍스트 영역을 제외한 카드 전체를 채운다. 카드가 화면을 꽉 채우는 건 뒷면(표현학습 뒤집기, 후속 이슈)을 담기 위함 */}
      <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-foreground">
        {scenario.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 백엔드 썸네일 도메인이 미정이라 next/image 원격 허용 목록을 아직 못 만든다
          <img
            src={scenario.thumbnailUrl}
            alt={scenario.scenarioTitle}
            className={`h-full w-full object-cover transition-[filter] duration-500 ${
              locked ? 'brightness-70 grayscale' : ''
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary">
            <span className="tossface text-6xl">💬</span>
          </div>
        )}
      </div>

      {/* 텍스트 + CTA */}
      <div className="flex flex-none flex-col gap-3 px-5 pt-4 pb-5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-xl leading-snug font-extrabold ${
                locked ? 'text-muted-foreground' : 'text-foreground'
              }`}
            >
              {scenario.scenarioTitle}
            </p>
            {completed && (
              <StarRating
                rating={scenario.starRating ?? 0}
                className="mt-1.5 shrink-0"
              />
            )}
          </div>
          {scenario.briefing && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed font-medium text-muted-foreground">
              {scenario.briefing}
            </p>
          )}
        </div>

        {locked ? (
          <div className="flex h-14 w-full items-center justify-center gap-1.5 rounded-xl bg-secondary text-base font-bold text-muted-foreground">
            잠겨있어요 <LockIcon size={16} />
          </div>
        ) : (
          <Button
            onClick={() => onStart(scenario)}
            variant={completed ? 'secondary' : 'primary'}
          >
            {completed ? '다시 해볼게요' : '시작할게요'}
            <ArrowRightIcon size={16} />
          </Button>
        )}
      </div>
    </div>
  );
};
