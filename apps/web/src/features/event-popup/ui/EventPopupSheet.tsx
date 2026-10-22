// 이벤트 공지 바텀시트 — 시트 위쪽을 꽉 채운 4:3 이미지 한 장 + 자세히 보기·닫기. 문구는 이미지에 들어 있다 (피그마 LAN-739)
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
    {/* 시트의 위·옆 여백(24px)을 걷어 내 이미지가 시트 위쪽을 꽉 채우게 한다 — 모서리는 시트와 같이 둥글게 잘린다 */}
    <button
      type="button"
      className="-mx-6 -mt-6 block w-[calc(100%+3rem)] overflow-hidden rounded-t-3xl"
      onClick={onOpenDetail}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 나중에 서버가 주는 임의 주소의 이미지라 next/image 도메인 허용 목록에 묶지 않는다 */}
      <img
        src={popup.imageUrl}
        alt={popup.imageAlt}
        className="aspect-[4/3] w-full object-cover"
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
