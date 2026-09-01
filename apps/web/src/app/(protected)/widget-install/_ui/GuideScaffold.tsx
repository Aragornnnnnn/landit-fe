// 설치 안내 화면 공통 뼈대 — 온보딩과 같은 결의 제목·목업·CTA 배치
'use client';

import { motion } from 'motion/react';

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

// 홈 화면 목업의 앱 자리들 — 화면마다 좌표만 다르고 생김새는 같다 (편집 모드만 살짝 밝다)
export const AppSlots = ({
  slots,
  className = 'rounded-[14px] bg-white/55',
}: {
  slots: ReadonlyArray<readonly [number, number]>;
  className?: string;
}) =>
  slots.map(([left, top]) => (
    <div
      key={`${left}-${top}`}
      className={`absolute size-[52px] ${className}`}
      style={{ left, top }}
    />
  ));

// iOS 편집 모드의 좌우 캡슐 버튼
export const Capsule = ({
  left,
  highlight = false,
  children,
}: {
  left: number;
  highlight?: boolean;
  children: React.ReactNode;
}) => (
  <span
    className={`absolute top-[16px] rounded-[20px] border border-[#c9d4e2] px-4 py-1.5 text-[12px] font-bold whitespace-nowrap text-[#3c4654] ${
      highlight ? 'bg-white' : 'bg-white/90'
    }`}
    style={{ left }}
  >
    {children}
  </span>
);

// 손끝이 누르는 표시 — 주황 원과 퍼져 나가는 물결로 "여기를 누른다"를 눈에 띄게 짚는다.
// press(꾹 누름)는 물결이 딱 한 번 번지고 손끝은 눌린 채 유지된다 — "한 번 오래 누른다"를 뜻한다.
// tap(가볍게 누름)은 작은 물결이 톡톡 되풀이된다 — "여기를 누르라"는 지목이다
export const TouchPulse = ({
  left,
  top,
  size = 48,
  mode = 'press',
}: {
  left: number;
  top: number;
  size?: number;
  mode?: 'press' | 'tap';
}) => {
  const press = mode === 'press';
  return (
    <div className="absolute" style={{ left, top, width: size, height: size }}>
      {/* 퍼지는 물결 — press는 한 번만(두 번 눌러야 하나 오해 방지), tap은 반복 */}
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ border: '2px solid rgba(224,122,58,0.55)' }}
        initial={false}
        animate={{ scale: [0.4, press ? 1.9 : 1.5], opacity: [0, 0.6, 0] }}
        transition={{
          duration: press ? 0.7 : 0.75,
          repeat: press ? 0 : Infinity,
          ease: 'easeOut',
          times: [0, 0.25, 1],
        }}
      />
      {/* 손끝 — press는 눌러 들어간 채 유지(꾹), tap은 톡톡 눌렸다 돌아온다 */}
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(224,122,58,0.6), rgba(224,122,58,0.28))',
          boxShadow: '0 2px 8px rgba(224,122,58,0.35)',
        }}
        initial={{ scale: press ? 1.1 : 1 }}
        animate={press ? { scale: 0.9 } : { scale: [1, 0.85, 1] }}
        transition={
          press
            ? { duration: 0.35, ease: 'easeOut' }
            : { duration: 0.75, repeat: Infinity, ease: 'easeInOut' }
        }
      />
    </div>
  );
};
