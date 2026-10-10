'use client';

// 알람이 울릴 때 모습 — 플랫폼에 맞는 잠금화면 폰 그림(피그마 내보내기, 그림자는 여기서 입힌다).
// 알람 소개와 알람 수정 화면이 같이 쓴다
import Image from 'next/image';

import {
  preloadImages,
  type PreloadableImage,
} from '@/shared/lib/preload-next-images';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';

import { alarmPlatform } from '../model/shell-alarm';

const PREVIEWS = {
  ios: {
    src: '/images/alarm/lock-screen-ios.webp',
    // 그림 높이 / 폭
    ratio: 991 / 488,
    // "대화하러 가기" 버튼 윗변 — 그림 높이 기준(피그마 폰 목업 346/496)
    buttonTop: 346 / 496,
  },
  android: {
    src: '/images/alarm/lock-screen-android.webp',
    ratio: 1006 / 488,
    buttonTop: 394.6 / 496,
  },
} as const;

type Platform = keyof typeof PREVIEWS;

// 그리는 곳과 미리 받는 곳이 같은 객체를 써야 최적화 주소가 맞아 캐시가 이어진다
const previewImage = (platform: Platform, width: number): PreloadableImage => ({
  src: PREVIEWS[platform].src,
  width,
  height: Math.round(width * PREVIEWS[platform].ratio),
});

// 알람 소개 화면의 폰 그림 폭
export const INTRO_PREVIEW_WIDTH = 250;

/** 알람 소개에 들어가기 전에 폰 그림을 받아 둔다 — 튀어 오르는 폰이 빈 자리로 오르지 않게 */
export const preloadIntroPreview = () =>
  preloadImages([previewImage(alarmPlatform(), INTRO_PREVIEW_WIDTH)]);

export const useLockScreenPreview = () =>
  // 서버는 셸을 모른다 — 플랫폼은 브라우저에서 정해 하이드레이션이 어긋나지 않게 한다
  PREVIEWS[useClientOnlyValue(alarmPlatform, 'ios')];

export const LockScreenPreview = ({
  width,
  className,
}: {
  width: number;
  className?: string;
}) => {
  const platform = useClientOnlyValue<Platform>(alarmPlatform, 'ios');
  return (
    <Image
      {...previewImage(platform, width)}
      alt="잠금화면 위에 뜬 오늘의 시나리오 알람"
      priority
      draggable={false}
      className={`drop-shadow-[0_18px_28px_rgba(0,0,0,0.22)] select-none ${className ?? ''}`}
    />
  );
};
