// 이벤트 공지 바텀시트 — 시트 위쪽을 꽉 채운 4:3 이미지 한 장 + 자세히 보기·닫기. 문구는 이미지에 들어 있다 (피그마 LAN-739)
'use client';

import { useTranslations } from 'next-intl';

import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

// 시트의 위·옆 여백(24px)을 걷어 내 이미지가 시트 위쪽을 꽉 채우게 한다 — 모서리는 시트와 같이 둥글게 잘린다
const FULL_BLEED =
  '-mx-6 -mt-6 block w-[calc(100%+3rem)] overflow-hidden rounded-t-3xl';

export const EventPopupSheet = ({
  open,
  imageUrl,
  onOpenDetail,
  onClose,
}: {
  open: boolean;
  imageUrl: string;
  /** 누를 곳이 없는 공지면 비워 둔다 — 이미지는 그림으로만 두고 「자세히 보기」를 빼고 닫기만 남긴다 */
  onOpenDetail?: () => void;
  onClose: () => void;
}) => {
  const t = useTranslations('eventPopup.sheet');
  // 서버가 이미지 설명을 주지 않는다 — 스크린 리더엔 공지라는 것만 알린다
  const label = t('imageLabel');
  const image = (
    // eslint-disable-next-line @next/next/no-img-element -- 서버가 주는 임의 주소의 이미지라 next/image 도메인 허용 목록에 묶지 않는다
    <img
      src={imageUrl}
      alt={label}
      className="aspect-[4/3] w-full object-cover"
    />
  );

  return (
    <BottomSheet open={open} onClose={onClose}>
      {/* 문구가 이미지 안에 있어 보이는 제목은 없다 */}
      <BottomSheet.Title className="sr-only">{label}</BottomSheet.Title>
      {onOpenDetail ? (
        <>
          <button type="button" className={FULL_BLEED} onClick={onOpenDetail}>
            {image}
          </button>
          <Button size="md" className="mt-4" onClick={onOpenDetail}>
            {t('detailButton')}
          </Button>
        </>
      ) : (
        <div className={FULL_BLEED}>{image}</div>
      )}
      <button
        type="button"
        className={`${onOpenDetail ? 'mt-3' : 'mt-4'} w-full text-center text-sm font-semibold text-muted-foreground`}
        onClick={onClose}
      >
        {t('closeButton')}
      </button>
    </BottomSheet>
  );
};
