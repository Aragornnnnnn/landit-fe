// 위젯 미리보기 카드 — 설치 안내 화면들이 공유하는 2×2(스트릭)·4×2(카드 도착) 목업
'use client';

import Image from 'next/image';

import fruitImage from '../assets/fruit.webp';
import randiImage from '../assets/randi-widget.webp';
import carpetImage from '../assets/widget-carpet.webp';

// 시안 원본(2×2는 140, 4×2는 214×100) 좌표를 그대로 두고 통째로 스케일한다 — 쓰는 곳마다 크기가 달라서
const SMALL_BASE = 140;
const MEDIUM_BASE = { width: 214, height: 100 };

// 종잇조각 배치 — [left, top, size, rotate, color]. 140 기준 시안 좌표 그대로
const CONFETTI = [
  [12.4, 42.8, 8, -24, 'rgba(224,122,58,0.92)'],
  [118.3, 39, 7.1, 18, 'rgba(91,62,150,0.92)'],
  [23, 81.1, 6.2, -40, 'rgba(255,196,77,0.92)'],
  [124.1, 90.5, 8, -12, 'rgba(224,83,63,0.92)'],
  [3.8, 109.9, 6.2, 32, 'rgba(91,62,150,0.92)'],
  [129.4, 121.6, 7.1, -20, 'rgba(255,196,77,0.92)'],
  [35.4, 26.2, 5.3, -48, 'rgba(224,122,58,0.92)'],
  [104.6, 15.1, 5.3, -30, 'rgba(91,62,150,0.92)'],
  [59.9, 117, 5.3, 24, 'rgba(224,83,63,0.92)'],
] as const;

// 스케일 래퍼 — 원본 좌표로 그린 내용을 목표 크기에 맞춰 축소한다
const Scaled = ({
  base,
  width,
  children,
}: {
  base: { width: number; height: number };
  width: number;
  children: React.ReactNode;
}) => {
  const scale = width / base.width;
  return (
    <div style={{ width, height: base.height * scale }}>
      <div
        className="origin-top-left"
        style={{ transform: `scale(${scale})`, ...base }}
      >
        {children}
      </div>
    </div>
  );
};

// 2×2 스트릭 위젯 — 래디 + 열매 6 + "오늘도 완료!" 색종이
export const WidgetPreviewSmall = ({
  size = SMALL_BASE,
}: {
  size?: number;
}) => (
  <Scaled base={{ width: SMALL_BASE, height: SMALL_BASE }} width={size}>
    <div className="relative size-[140px] overflow-hidden rounded-[24px] bg-gradient-to-b from-[#fff8e2] to-[#ffe7b2]">
      <Image
        src={randiImage}
        alt=""
        className="absolute top-[39px] left-[-6px] size-[152px] max-w-none"
      />
      {CONFETTI.map(([left, top, side, rotate, color]) => (
        <span
          key={`${left}-${top}`}
          className="absolute rounded-[1.3px]"
          style={{
            left,
            top,
            width: side,
            height: side,
            backgroundColor: color,
            transform: `rotate(${rotate}deg)`,
          }}
        />
      ))}
      <span className="absolute top-[40px] left-[7px] w-[126px] text-center text-[12px] text-[#f0912a] opacity-80">
        오늘도 완료!
      </span>
      <span className="absolute top-[11px] left-[49px] flex items-center gap-[4px]">
        <Image src={fruitImage} alt="" className="size-[19.5px]" />
        <span className="text-[30px] leading-[1.1] font-black text-[#f0912a] opacity-[0.94]">
          6
        </span>
      </span>
    </div>
  </Scaled>
);

// 4×2 카드 도착 위젯 — 양탄자 배송 아트 + 열매 5 + "카드 도착!"
export const WidgetPreviewMedium = ({
  width = MEDIUM_BASE.width,
}: {
  width?: number;
}) => (
  <Scaled base={MEDIUM_BASE} width={width}>
    <div className="relative h-[100px] w-[214px] overflow-hidden rounded-[16px] bg-[#ffefd1]">
      <Image
        src={carpetImage}
        alt=""
        className="absolute top-[-20px] left-[-27px] h-[135px] w-[267px] max-w-none"
      />
      <Image
        src={fruitImage}
        alt=""
        className="absolute top-[16px] left-[15px] size-[15px]"
      />
      <span className="absolute top-[10px] left-[35px] text-[20px] font-black text-[#8a5a0e]">
        5
      </span>
      <span className="absolute top-[52px] left-[15px] text-[11px] text-[#8a5a0e]">
        카드 도착!
      </span>
      <span className="absolute top-[85px] left-[41px] text-[8px] text-[rgba(156,98,0,0.72)] opacity-70">
        룸메이트와 첫인사
      </span>
    </div>
  </Scaled>
);
