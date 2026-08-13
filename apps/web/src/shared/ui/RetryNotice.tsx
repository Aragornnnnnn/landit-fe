'use client';

// 조회가 실패했을 때 그 자리에 뜨는 안내 — 실패를 알리고 다시 시도할 길을 준다
// 재시도 계측을 안에서 발화한다 — 호출부는 어느 화면인지만 넘긴다.
// 같은 안내가 여섯 화면에 복사돼 있었고, 그중 편지함·스트릭 둘만 여기로 옮겼다.
// 남은 넷(시나리오·대화·카드 뒷면·표현 분기)은 role="alert"가 없어 옮기면 동작이 바뀐다 — 별도 작업
import { EVENTS, type RetryScreen } from '@landit/analytics';

import { track } from '@/shared/analytics';

import { Button } from './Button';

interface RetryNoticeProps {
  // 어느 화면의 실패인지 — 계측이 이 값으로 갈린다
  screen: RetryScreen;
  message: string;
  onRetry: () => void;
}

export const RetryNotice = ({ screen, message, onRetry }: RetryNoticeProps) => (
  // 스켈레톤이 조용히 교체되면 보조 기술은 실패를 모른다 — 뜨는 즉시 읽히게 한다
  <div
    role="alert"
    className="flex flex-col items-center gap-4 px-6 pt-24 text-center"
  >
    <p className="text-muted-foreground">{message}</p>
    <Button
      variant="secondary"
      size="sm"
      className="w-auto px-6"
      onClick={() => {
        track(EVENTS.ERROR_RETRIED, { screen });
        onRetry();
      }}
    >
      다시 시도
    </Button>
  </div>
);
