// 화면 맨 위 진행 게이지 — 표현 학습 스텝과 시나리오 대화가 같은 모양으로 쓴다. 다 채운 성공 연출은 success 톤

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
      className={`h-full transition-[width,background-color] duration-300 ${
        tone === 'success' ? 'bg-success' : 'bg-primary'
      }`}
      style={{ width: `${progress * 100}%` }}
    />
  </div>
);
