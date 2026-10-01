// 보여 줄 피드백이 없을 때의 한 장 — 무엇이 없는지 말하고 나갈 길을 하나 준다. 대화 직후 피드백과 시나리오 기록이 같이 쓴다
import { Button } from '@/shared/ui/Button';

export const FeedbackNotice = ({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel: string;
  onAction: () => void;
}) => (
  <main className="mx-auto flex h-dvh max-w-[430px] flex-col items-center justify-center gap-6 bg-background px-6">
    <p className="text-center text-base font-medium text-muted-foreground">
      {message}
    </p>
    <Button className="w-auto px-8" onClick={onAction}>
      {actionLabel}
    </Button>
  </main>
);
