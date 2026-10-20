'use client';

// 설문 상단 — 뒤로가기와 진행 막대. 문항이 열 개가 넘어 점 대신 막대와 "3/12"로 보여준다
import { StepHeader } from '@/shared/ui/StepHeader';

export const SurveyHeader = ({
  questionIndex,
  questionCount,
  onBack,
}: {
  // 안내 화면처럼 문항이 아닐 땐 null — 진행 막대를 감춘다
  questionIndex: number | null;
  questionCount: number;
  onBack: () => void;
}) => (
  <StepHeader onBack={onBack}>
    {questionIndex !== null && (
      <div className="flex items-center gap-2.5">
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border">
          {/* 너비 대신 scale을 움직인다 — 화면 전환과 겹쳐도 레이아웃을 다시 계산하지 않는다 */}
          <div
            className="h-full w-full origin-left rounded-full bg-foreground transition-transform duration-300"
            style={{
              transform: `scaleX(${(questionIndex + 1) / questionCount})`,
            }}
          />
        </div>
        <span className="text-[13px] font-bold text-muted-foreground tabular-nums">
          {questionIndex + 1}/{questionCount}
        </span>
      </div>
    )}
  </StepHeader>
);
