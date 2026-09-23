'use client';

// 복습을 풀 수 없을 때의 안내 — 기한이 지났거나 조회에 실패했을 때. 서버 문구를 그대로 보여주고 홈으로 돌려보낸다
import { Button } from '@/shared/ui/Button';

interface ReviewNoticeProps {
  message: string;
  onHome: () => void;
  // 다시 시도해 볼 만한 실패(네트워크·서버 오류)일 때만 — 기한·권한처럼 결론이 난 경우엔 없다
  onRetry?: () => void;
}

export const ReviewNotice = ({
  message,
  onHome,
  onRetry,
}: ReviewNoticeProps) => (
  <main className="mx-auto flex h-dvh max-w-[430px] flex-col items-center justify-center gap-5 bg-background px-6 text-center">
    <p
      role="alert"
      className="text-sm font-medium break-keep text-muted-foreground"
    >
      {message}
    </p>
    <div className="flex w-full flex-col gap-2">
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          다시 시도
        </Button>
      )}
      <Button variant={onRetry ? 'ghost' : 'primary'} onClick={onHome}>
        홈으로 갈게요
      </Button>
    </div>
  </main>
);
