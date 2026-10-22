// 이벤트 공지 바텀시트 — 정사각형 이미지 한 장 + 자세히 보기·닫기. 문구는 이미지에 들어 있다 (피그마 LAN-739)
'use client';

import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

import type { EventPopup } from '../model/event-popups';

export const EventPopupSheet = ({
  open,
  popup,
  onOpenDetail,
  onClose,
}: {
  open: boolean;
  popup: EventPopup;
  onOpenDetail: () => void;
  onClose: () => void;
}) => (
  <BottomSheet open={open} onClose={onClose}>
    {/* 문구가 이미지 안에 있어 보이는 제목은 없다 — 시트 이름만 이미지 설명으로 읽힌다 */}
    <BottomSheet.Title className="sr-only">{popup.imageAlt}</BottomSheet.Title>
    <button
      type="button"
      className="block w-full overflow-hidden rounded-2xl"
      onClick={onOpenDetail}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 나중에 서버가 주는 임의 주소의 이미지라 next/image 도메인 허용 목록에 묶지 않는다 */}
      <img
        src={popup.imageUrl}
        alt={popup.imageAlt}
        className="aspect-square w-full object-cover"
      />
    </button>
    <Button className="mt-5" onClick={onOpenDetail}>
      자세히 보기
    </Button>
    <button
      type="button"
      className="mt-4 w-full text-center text-sm font-semibold text-muted-foreground"
      onClick={onClose}
    >
      닫기
    </button>
  </BottomSheet>
);
