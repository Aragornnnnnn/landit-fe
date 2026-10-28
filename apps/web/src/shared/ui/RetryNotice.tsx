'use client';

// 조회가 실패했을 때 그 자리에 뜨는 안내 — 실패를 알리고 다시 시도할 길을 준다
// 재시도 계측을 안에서 발화한다 — 호출부는 어느 화면인지만 넘긴다.
import { EVENTS, type RetryScreen } from '@landit/analytics';
import { useTranslations } from 'next-intl';

import { track } from '@/shared/analytics';

import { Button } from './Button';

interface RetryNoticeProps {
  // 어느 화면의 실패인지 — 계측이 이 값으로 갈린다
  screen: RetryScreen;
  message: string;
  onRetry: () => void;
  // 남은 세로 공간 한가운데에 놓는다 — 화면 본문 전체가 이 안내로 바뀌는 자리
  fill?: boolean;
}

export const RetryNotice = ({
  screen,
  message,
  onRetry,
  fill = false,
}: RetryNoticeProps) => {
  const t = useTranslations('common');

  return (
    // 스켈레톤이 조용히 교체되면 보조 기술은 실패를 모른다 — 뜨는 즉시 읽히게 한다
    <div
      role="alert"
      className={`flex flex-col items-center gap-4 px-6 text-center ${fill ? 'flex-1 justify-center' : 'pt-24'}`}
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
        {t('retryButton')}
      </Button>
    </div>
  );
};
