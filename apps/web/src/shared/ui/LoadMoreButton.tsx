// 목록 끝의 "더 보기" — 다음 장을 이어 받는다. 줄과 같은 여백에 두어 목록의 마지막 한 줄처럼 읽히게 한다
import { useTranslations } from 'next-intl';

import { ChevronRightIcon } from './Icons';

export const LoadMoreButton = ({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) => {
  const t = useTranslations('common.loadMoreButton');

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-1 py-4 text-sm font-semibold text-muted-foreground disabled:opacity-60"
    >
      {loading ? t('loadingButton') : t('moreButton')}
      {/* 아래 화살표가 아직 공용 아이콘에 없다 — 있는 걸 돌려 쓴다 */}
      {!loading && <ChevronRightIcon size={16} className="rotate-90" />}
    </button>
  );
};
