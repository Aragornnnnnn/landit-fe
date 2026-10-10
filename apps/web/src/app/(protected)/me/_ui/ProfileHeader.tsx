'use client';

// 마이페이지 상단 — 이름(눌러서 바꾸기)과 로그인 계정, 오른쪽에 학습 수준의 마법사 래디와 레벨 이름. 수준을 아직 모르면 기본 래디만 선다.
import { useEffect, useState } from 'react';
import Image from 'next/image';

import {
  LEVEL_IMAGES,
  LEVEL_NAMES,
} from '@/features/feedback/model/level-assessment';
import { toEnglishLevel } from '@/features/onboarding/model/english-level';
import { useLearningLevelQuery } from '@/features/onboarding/model/useLearningLevelQuery';
import { useAuthStore } from '@/shared/auth/auth-store';
import {
  preloadImages,
  type PreloadableImage,
} from '@/shared/lib/preload-next-images';
import { PencilIcon } from '@/shared/ui/Icons';
import { AppleIcon, GoogleIcon, KakaoIcon } from '@/shared/ui/SocialIcons';

import { NicknameSheet } from './NicknameSheet';

const DEFAULT_IMAGE: PreloadableImage = {
  src: '/images/character/landy-normal.webp',
  width: 200,
  height: 200,
};

// 로그인한 곳을 로그인 버튼과 같은 심볼·바탕색의 작은 네모 배지로. 구글만 흰 바탕이라 테두리를 두른다
const PROVIDER_BADGE: Record<
  string,
  { icon: React.ReactNode; background: string; bordered?: boolean }
> = {
  KAKAO: { icon: <KakaoIcon size={11} />, background: '#FEE500' },
  GOOGLE: {
    icon: <GoogleIcon size={10} />,
    background: '#fff',
    bordered: true,
  },
  APPLE: { icon: <AppleIcon size={11} />, background: '#000' },
};

export const ProfileHeader = () => {
  const member = useAuthStore((state) => state.member);
  const { data, isPending } = useLearningLevelQuery();
  const level = toEnglishLevel(data?.learningLevel ?? null);
  // 수준을 받는 동안 마법사 다섯 장을 미리 받는다 — 어느 레벨이 오든 그 자리에서 바로 그려진다.
  // 결과 화면과 같은 객체라 거기서 받은 그림이면 캐시가 그대로 맞는다
  useEffect(() => {
    preloadImages([...Object.values(LEVEL_IMAGES), DEFAULT_IMAGE]);
  }, []);
  const badge = member?.provider ? PROVIDER_BADGE[member.provider] : undefined;
  const nickname = member?.nickname?.trim() ?? '';
  const [nicknameSheetOpen, setNicknameSheetOpen] = useState(false);

  return (
    <div className="flex items-center justify-between px-1.5 pt-2 pb-1">
      <div className="min-w-0">
        <button
          type="button"
          onClick={() => setNicknameSheetOpen(true)}
          className="-mx-1 max-w-full rounded-lg px-1 text-left transition-transform active:scale-[0.97]"
          aria-label="닉네임 바꾸기"
        >
          {/* 긴 이름은 자르지 않고 줄을 넘긴다 — 연필은 마지막 글자 뒤에 붙는다 */}
          <span
            className="text-[22px] leading-tight font-bold break-words"
            style={{ color: '#111' }}
          >
            {nickname || '게스트'}
          </span>
          <PencilIcon
            size={16}
            className="ml-1.5 inline-block align-baseline text-muted-foreground"
          />
        </button>
        {member?.email && (
          <p
            className="mt-2 flex items-center gap-2 text-[12.5px]"
            style={{ color: '#6b7280' }}
          >
            {badge && (
              <span
                className="flex size-[18px] shrink-0 items-center justify-center rounded-[5px]"
                style={{
                  background: badge.background,
                  boxShadow: badge.bordered
                    ? '0 0 0 1px rgba(0,0,0,0.08)'
                    : undefined,
                }}
                aria-hidden="true"
              >
                {badge.icon}
              </span>
            )}
            <span className="truncate">{member.email}</span>
          </p>
        )}
      </div>
      {/* 수준을 받는 동안은 자리만 잡는다 — 기본 래디가 떴다가 레벨 래디로 바뀌는 걸 막는다 */}
      <div className="flex min-h-[112px] shrink-0 flex-col items-center">
        {!isPending && (
          <Image
            {...(level ? LEVEL_IMAGES[level] : DEFAULT_IMAGE)}
            alt=""
            className="h-[112px] w-auto"
          />
        )}
        {level && (
          <p
            className="mt-0.5 text-[12.5px] font-bold"
            style={{ color: '#111' }}
          >
            {LEVEL_NAMES[level]} Lv.{level}
          </p>
        )}
      </div>
      <NicknameSheet
        open={nicknameSheetOpen}
        current={nickname}
        onClose={() => setNicknameSheetOpen(false)}
      />
    </div>
  );
};
