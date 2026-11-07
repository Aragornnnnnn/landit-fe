// 기록·요약처럼 목록에서 들어온 화면의 머리 — 가운데 제목, 왼쪽 뒤로가기(또는 닫기), 필요하면 오른쪽 동작 하나.
// 안전 영역은 화면(main)이 띄운다. 스크롤 그림자와 안전 영역을 스스로 챙기는 머리는 BackHeader다
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { useBackPress } from '@/shared/bridge/useBackPress';
import { ChevronLeftIcon, CloseIcon } from '@/shared/ui/Icons';

interface PageHeaderProps {
  title: ReactNode;
  onBack: () => void;
  // 흐름을 끝내고 나가는 화면은 X를 쓴다
  leading?: 'back' | 'close';
  backDisabled?: boolean;
  // 오른쪽 끝 동작 — 호출부가 뒤로가기와 같은 40px 버튼을 넣는다
  trailing?: ReactNode;
}

export const PageHeader = ({
  title,
  onBack,
  leading = 'back',
  backDisabled = false,
  trailing,
}: PageHeaderProps) => {
  const t = useTranslations('common');
  // 버튼이 잠긴 동안(나가는 중)은 뒤로가기도 아무 일을 하지 않는다 — 공통 처리로 넘기면 같은 화면에서 또 나가게 된다
  useBackPress(() => {
    if (!backDisabled) onBack();
  });
  return (
    <header className="relative flex h-14 flex-none items-center justify-center">
      <button
        type="button"
        onClick={onBack}
        disabled={backDisabled}
        className="absolute left-3 flex size-10 items-center justify-center text-foreground"
        aria-label={leading === 'close' ? t('closeLabel') : t('backLabel')}
        data-no-haptic
      >
        {leading === 'close' ? (
          <CloseIcon size={24} />
        ) : (
          <ChevronLeftIcon size={24} />
        )}
      </button>
      {/* 양옆 버튼 자리를 비워 긴 제목이 버튼 밑으로 들어가지 않게 한다 */}
      <h1 className="truncate px-14 text-17 font-bold text-foreground">
        {title}
      </h1>
      {trailing && <div className="absolute right-3">{trailing}</div>}
    </header>
  );
};
