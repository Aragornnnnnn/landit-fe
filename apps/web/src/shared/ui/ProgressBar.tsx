// 화면 맨 위 진행 게이지 — 표현 학습 스텝과 시나리오 대화가 같은 모양으로 쓴다. 다 채운 성공 연출은 success 톤

import { DURATION, EASE_STANDARD } from '@/shared/motion';

// 기본 primary, 다 채운 성공 연출 중엔 success(초록)
export type ProgressTone = 'primary' | 'success';

interface ProgressBarProps {
  progress: number; // 0..1
  tone?: ProgressTone;
  label: string;
}

export const ProgressBar = ({
  progress,
  tone = 'primary',
  label,
}: ProgressBarProps) => (
  <div
    role="progressbar"
    aria-label={label}
    aria-valuenow={Math.round(progress * 100)}
    aria-valuemin={0}
    aria-valuemax={100}
    className="h-1 w-full bg-secondary"
  >
    <div
      className={`h-full transition-[width,background-color] ${
        tone === 'success' ? 'bg-success' : 'bg-primary'
      }`}
      // 대화에선 새 말풍선과 같은 순간에 차오른다 — 길이·곡선을 말풍선 등장과 같은 토큰에서 받는다
      style={{
        width: `${progress * 100}%`,
        transitionDuration: `${DURATION.turnReveal}s`,
        transitionTimingFunction: `cubic-bezier(${EASE_STANDARD.join(', ')})`,
      }}
    />
  </div>
);
