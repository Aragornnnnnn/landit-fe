'use client';

// 프리미엄 프리뷰의 뒷면 안내 두 박자 — 표현 목록 전체를 잠깐 소개한 뒤, 서버가 무료로 연 표현을 비추고 누르게 한다
import { useRef, useState } from 'react';
import type { PreviewEndReason } from '@landit/analytics';

import { useAuthStore } from '@/shared/auth/auth-store';

import { CardSpotlight } from './CardSpotlight';

// 뒤집기(0.5초)가 끝나고 목록이 자리 잡은 뒤에 자리를 잰다
const SETTLE_MS = 900;
// 목록 소개를 읽을 시간 — 지나면 저절로 무료 표현으로 좁힌다
const INTRO_MS = 2500;

export const FreeExpressionSpotlight = ({
  list,
  onOpen,
  onEnd,
}: {
  // 표현 목록을 감싼 칸 — 목록과 무료 표현을 표식으로 찾는다
  list: React.RefObject<HTMLElement | null>;
  onOpen: () => void;
  // 비출 것을 못 찾았다 — 프리뷰를 여기서 끝낸다
  onEnd: (reason: PreviewEndReason) => void;
}) => {
  const [step, setStep] = useState<'intro' | 'free'>('intro');
  // 손가락이 누르기를 부추겨 연타가 잦다 — 표현 화면은 한 번만 연다
  const opened = useRef(false);
  const openOnce = () => {
    if (opened.current) return;
    opened.current = true;
    onOpen();
  };
  const nickname = useAuthStore((state) => state.member?.nickname ?? null);
  const find = (selector: string) =>
    list.current?.querySelector<HTMLElement>(selector) ?? null;

  if (step === 'intro') {
    return (
      <CardSpotlight
        key="intro"
        findTarget={() => find('[data-expression-items]')}
        label="맞춤 표현 학습 소개"
        settleMs={SETTLE_MS}
        placement="above"
        introMs={INTRO_MS}
        onMissing={() => onEnd('no_target')}
        onTap={() => setStep('free')}
      >
        방금 대화로 만든
        <br />
        <span className="text-primary">
          {nickname ? `${nickname}님` : '나만의'} 맞춤 표현 학습
        </span>
        이에요
      </CardSpotlight>
    );
  }
  return (
    <CardSpotlight
      key="free"
      findTarget={() => find('[data-free-expression]')}
      label="첫 표현 무료로 배우기"
      settleMs={0}
      onMissing={() => onEnd('no_target')}
      onTap={openOnce}
    >
      첫 표현은 <span className="text-primary">무료</span>로 열어 드렸어요
      <br />
      눌러서 바로 배워 봐요
    </CardSpotlight>
  );
};
