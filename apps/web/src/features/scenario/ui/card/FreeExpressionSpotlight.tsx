'use client';

// 프리미엄 프리뷰의 뒷면 안내 두 박자 — 표현 목록 전체를 잠깐 소개한 뒤, 서버가 무료로 연 표현을 비추고 누르게 한다
import { useRef, useState } from 'react';
import type { PreviewEndReason } from '@landit/analytics';
import { useTranslations } from 'next-intl';

import { useAuthStore } from '@/shared/auth/auth-store';
import { lineBreak } from '@/shared/i18n/rich';

import { CardSpotlight } from './CardSpotlight';

// 뒤집기(0.5초)가 끝나고 목록이 자리 잡은 뒤에 자리를 잰다
const SETTLE_MS = 900;
// 목록 소개를 읽을 시간 — 지나면 저절로 무료 표현으로 좁힌다
const INTRO_MS = 2500;

// 문구 속 <em>을 주황 글자로
const highlight = (chunks: React.ReactNode) => (
  <span className="text-primary">{chunks}</span>
);

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
  const t = useTranslations('scenario.freeExpressionSpotlight');
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
        label={t('introLabel')}
        settleMs={SETTLE_MS}
        placement="above"
        introMs={INTRO_MS}
        onMissing={() => onEnd('no_target')}
        onTap={() => setStep('free')}
      >
        {nickname
          ? t.rich('introNamedBody', { ...lineBreak, em: highlight, nickname })
          : t.rich('introBody', { ...lineBreak, em: highlight })}
      </CardSpotlight>
    );
  }
  return (
    <CardSpotlight
      key="free"
      findTarget={() => find('[data-free-expression]')}
      label={t('freeLabel')}
      settleMs={0}
      onMissing={() => onEnd('no_target')}
      onTap={openOnce}
    >
      {t.rich('freeBody', { ...lineBreak, em: highlight })}
    </CardSpotlight>
  );
};
