'use client';

// 환급 소개 맨 위 연출 — 동전이 하루씩 쌓이고, 마지막 날 기둥이 「쾅」 서면 그 위로 토스 입금 알림이 잠깐 튀어나왔다 사라진다.
// 한 번만 돈다 — 알림이 걷힌 뒤에는 동전 카드의 설명을 가리지 않고 그대로 읽힌다.
// 그림은 눌리지 않고 읽어 주지도 않는다 — 같은 내용을 제목과 동전 카드 아래 두 줄이 글로 말한다
import { useEffect, useState } from 'react';
import Image from 'next/image';

import { prefersReducedMotion } from '@/shared/lib/reduced-motion';
import { useInView } from '@/shared/lib/useInView';

import tossAppIcon from '../assets/toss-app-icon.webp';
import type { RewardOffer } from '../model/refund-offer';
import { COIN_TOWER_STEP, CoinStackCard } from './CoinStackCard';

/** 장면 — 빈 카드, 1·2·3일 기둥, 마지막 날 기둥, 입금 알림. 다 지나면 알림 없이 다 쌓인 카드에 머문다 */
const DEPOSIT_STEP = COIN_TOWER_STEP + 1;
const DURATIONS = [400, 450, 450, 600, 1300, 2400] as const;
const SETTLED_STEP = DURATIONS.length;

/** 장면을 한 번만 차례로 넘긴다 — 동작 줄이기를 켠 기기는 바로 마지막(다 쌓인) 장면 */
const usePlayOnce = (start: boolean) => {
  const [reduced] = useState(prefersReducedMotion);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!start || reduced || step >= SETTLED_STEP) return;
    const timer = setTimeout(
      () => setStep((previous) => previous + 1),
      DURATIONS[step],
    );
    return () => clearTimeout(timer);
  }, [start, reduced, step]);

  return reduced ? SETTLED_STEP : step;
};

const SPRING = 'ease-[cubic-bezier(0.34,1.56,0.64,1)]';

export const RefundDepositDemo = ({
  offer,
  depositLabel,
}: {
  offer: RewardOffer;
  // 알림의 큰 글자 ("50,000원 입금")
  depositLabel: string;
}) => {
  // 화면에 들어온 순간 한 번 시작한다
  const { ref, inView } = useInView<HTMLDivElement>();
  const step = usePlayOnce(inView);
  const deposited = step === DEPOSIT_STEP;

  return (
    <div ref={ref} aria-hidden="true" className="relative">
      <CoinStackCard offer={offer} step={step} animated />
      {/* 입금 알림이 이 연출의 핵심이다 — 카드가 어두워지고 알림만 밝게 튀어나온다 */}
      <div
        className={`absolute inset-0 rounded-3xl bg-black/45 transition-opacity duration-300 ${deposited ? 'opacity-100' : 'opacity-0'}`}
      />
      {/* 카드보다 넓게, 카드를 뚫고 나오듯 작게 시작해 비스듬히 크게 튀어나온다 */}
      <div
        className={`absolute -inset-x-3 top-[34%] z-10 flex items-center gap-3 rounded-[24px] bg-white py-4 pr-5 pl-4 shadow-[0_22px_50px_rgba(0,0,0,0.45),0_0_0_1px_rgba(0,0,0,0.04)] ${
          deposited
            ? `scale-100 rotate-3 opacity-100 transition-[scale,opacity,rotate] duration-500 ${SPRING}`
            : step === SETTLED_STEP
              ? 'scale-95 opacity-0 transition-[scale,opacity] duration-300'
              : 'scale-[0.35] opacity-0'
        }`}
      >
        {/* 토스 앱 아이콘 — 브랜드 리소스 센터의 원본을 변형 없이, 흰 배경과 여백 그대로 쓴다 */}
        <Image
          src={tossAppIcon}
          alt=""
          className="size-[52px] shrink-0 rounded-[13px] border border-border"
        />
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[21px] leading-tight font-black text-foreground">
              {depositLabel}
            </p>
            <span className="shrink-0 text-[13px] text-muted-foreground">
              지금
            </span>
          </div>
          <p className="mt-1 text-[14px] font-medium text-muted-foreground">
            랜딧 → 내 계좌
          </p>
        </div>
      </div>
    </div>
  );
};
