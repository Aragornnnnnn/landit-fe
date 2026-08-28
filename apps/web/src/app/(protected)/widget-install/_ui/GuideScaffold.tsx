// 설치 안내 화면 공통 뼈대 — 온보딩과 같은 결의 제목·목업·CTA 배치
'use client';

import { Button } from '@/shared/ui/Button';

export const GuideScaffold = ({
  title,
  subtitle,
  cta,
  onCta,
  onLater,
  children,
}: {
  title: React.ReactNode;
  subtitle: string;
  cta: string;
  onCta: () => void;
  // 있으면 CTA 아래에 "나중에 하기" 텍스트 버튼이 붙는다
  onLater?: () => void;
  children: React.ReactNode;
}) => (
  <>
    <div className="flex flex-1 flex-col pt-7">
      <h1 className="text-3xl leading-[1.18] font-black tracking-normal">
        {title}
      </h1>
      <p className="mt-4 text-xl font-bold text-muted-foreground">{subtitle}</p>

      <div className="flex flex-1 items-center justify-center py-6">
        {children}
      </div>
    </div>

    <Button onClick={onCta}>{cta}</Button>
    {onLater && (
      <button
        type="button"
        onClick={onLater}
        className="mt-2 flex h-12 w-full items-center justify-center text-[15px] font-medium text-muted-foreground"
      >
        나중에 하기
      </button>
    )}
  </>
);

// 하늘색 폰 목업 틀 — 안내 화면들이 같은 틀 위에 각자의 장면을 그린다
export const PhoneMockup = ({ children }: { children: React.ReactNode }) => (
  <div className="relative h-[430px] w-[262px] overflow-hidden rounded-[28px] bg-gradient-to-b from-[#dceefb] to-[#f4f9ff]">
    {children}
  </div>
);
