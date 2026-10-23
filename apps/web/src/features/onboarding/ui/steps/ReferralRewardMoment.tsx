// 초대 코드 등록 성공 순간 — 코드 화면 위로 딤이 깔리고 코인과 적립 금액이 떴다가, 저절로 다음 단계로 넘어간다.
// 환급 화면의 「친구 가입 적립 순간」(피그마 P4)과 같은 연출이다
'use client';

import { useEffect, useEffectEvent, useState } from 'react';

// 환급 동전 그림은 reward feature가 정본이라 온보딩이 가로 import한다
import { Coin } from '@/features/reward/ui/common/Coin';
import { haptic } from '@/shared/haptics';
import { formatWon } from '@/shared/lib/won';

// 금액을 읽을 만큼만 머문다 — 버튼이 없어 사람이 넘길 수 없으니 너무 길면 멈춘 것처럼 보인다
const LEAVE_AFTER_MS = 1500;

export const ReferralRewardMoment = ({
  won,
  holdMs,
  onDone,
}: {
  // 등록한 조건으로 받은 금액 — 0이면 금액 없이 등록됐다고만 한다
  won: number;
  // 연출을 띄우기 전 기다릴 시간 — 그동안 뒤에 있는 「확인됐어요」가 보인다
  holdMs: number;
  onDone: () => void;
}) => {
  const [shown, setShown] = useState(holdMs === 0);
  // 부모가 다시 그려져 onDone이 바뀌어도 넘어갈 시계를 처음부터 다시 재지 않는다
  const leave = useEffectEvent(onDone);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setShown(true);
      haptic('success');
    }, holdMs);
    const leaveTimer = setTimeout(() => leave(), holdMs + LEAVE_AFTER_MS);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(leaveTimer);
    };
  }, [holdMs]);

  // 기다리는 동안에도 화면을 투명하게 덮는다 — 이미 등록됐는데 뒤로가기로 빠져 다음 단계로 못 가는 일을 막는다
  if (!shown) return <div aria-hidden className="fixed inset-0 z-50" />;

  return (
    <div
      role="status"
      aria-live="polite"
      // CSS 애니메이션 — rAF가 멎은 웹뷰에서도 돈다 (LAN-375 교훈)
      className="fixed inset-0 z-50 flex animate-[dim-in_0.25s_ease-out_both] flex-col items-center justify-center bg-black/55 px-6 text-center"
    >
      <Coin size={120} className="animate-[check-in_0.45s_ease-out_both]" />
      {won > 0 ? (
        <>
          <p className="mt-4 animate-[fade-up_0.35s_ease-out_0.15s_both] text-[40px] leading-tight font-black text-white">
            +{formatWon(won)}
          </p>
          <p className="mt-1 animate-[fade-up_0.35s_ease-out_0.25s_both] text-base font-bold text-white/90">
            초대 코드로 적립됐어요
          </p>
          {/* 현금이 아니라 환급 적립금이다 — 무료로 시작한 사람도 결제하면 그 환급에 더해진다는 걸 안다 */}
          <p className="mt-2 animate-[fade-up_0.35s_ease-out_0.35s_both] text-13 font-medium break-keep text-white/75">
            100일 프리미엄 이용권을 결제하면 환급 혜택에 바로 더해져요
          </p>
        </>
      ) : (
        <p className="mt-5 animate-[fade-up_0.35s_ease-out_0.15s_both] text-xl font-black text-white">
          초대 코드가 등록됐어요
        </p>
      )}
    </div>
  );
};
