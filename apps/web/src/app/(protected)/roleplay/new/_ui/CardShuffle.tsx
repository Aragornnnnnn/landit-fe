// 시나리오를 만드는 동안(2~4초) — 세 캐릭터 카드가 손에서 섞이듯 자리를 바꾸고, 아래 단계 글이 차례로 넘어간다.
// 이미지 생성이 아니라 transform만 쓰는 반복 연출이다. 고른 상대 카드가 가운데 맨 위에 선다
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

import type { Partner } from '@/features/conversation/model/character-look';
import { PARTNER_TINT } from '@/features/roleplay/ui/partner-tint';
import { PartnerBust } from '@/features/roleplay/ui/PartnerBust';
import { PARTNERS } from '@/features/small-talk/model/partner';
import { CheckIcon } from '@/shared/ui/Icons';

// 단계 글이 넘어가는 간격 — 응답 진행을 모르니 시간으로 넘기고, 마지막 단계에서 응답을 기다린다
const STEP_MS = 900;

// 뒤에 깔리는 두 장의 자리 — 왼쪽은 오른쪽으로, 오른쪽은 왼쪽으로 기운다
const BACK_POSES = [
  { x: -100, y: 40, rotate: 14 },
  { x: 100, y: 0, rotate: -14 },
] as const;

const SHUFFLE = { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } as const;

const ShuffleCard = ({
  partner,
  front,
}: {
  partner: Partner;
  front: boolean;
}) => (
  <div
    className={`absolute inset-0 overflow-clip rounded-3xl ${front ? 'shadow-[0_14px_30px_rgba(0,0,0,0.18)]' : 'opacity-90 shadow-[0_10px_20px_rgba(0,0,0,0.12)]'}`}
    style={{ background: PARTNER_TINT[partner] }}
  >
    <PartnerBust
      partner={partner}
      className="absolute -bottom-[3%] left-1/2 w-[78%] -translate-x-1/2"
    />
  </div>
);

type StepStatus = 'done' | 'current' | 'todo';

const toStepStatus = (index: number, current: number): StepStatus => {
  if (index < current) return 'done';
  if (index === current) return 'current';
  return 'todo';
};

const STEP_TEXT: Record<StepStatus, string> = {
  done: 'text-muted-foreground',
  current: 'font-bold text-foreground',
  todo: 'text-muted-foreground/40',
};

const STEP_ICON: Record<StepStatus, React.ReactNode> = {
  done: (
    <span className="flex size-4.5 items-center justify-center rounded-full bg-success text-white">
      <CheckIcon size={11} strokeWidth={3} />
    </span>
  ),
  current: (
    <span className="size-4.5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
  ),
  todo: (
    <span className="size-4.5 rounded-full border-2 border-muted-foreground/30" />
  ),
};

const StepRow = ({ label, status }: { label: string; status: StepStatus }) => (
  <li className={`flex items-center gap-2 text-sm ${STEP_TEXT[status]}`}>
    {STEP_ICON[status]}
    {label}
  </li>
);

export const CardShuffle = ({
  partner,
  partnerName,
}: {
  partner: Partner;
  // 문장 안에서 부르는 이름 (클로이 첫 마디 준비)
  partnerName: string;
}) => {
  const t = useTranslations('roleplay');
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const others = PARTNERS.map((item) => item.id).filter((id) => id !== partner);

  const steps = [
    t('generating.roleStepLabel'),
    t('generating.situationStepLabel'),
    t('generating.openingStepLabel', { name: partnerName }),
  ];

  useEffect(() => {
    const timer = setInterval(
      () => setStep((current) => Math.min(current + 1, steps.length - 1)),
      STEP_MS,
    );
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center pb-16">
      <div className="relative h-[300px] w-[200px]" aria-hidden>
        {others.map((id, index) => {
          const pose = BACK_POSES[index];
          return (
            <motion.div
              key={id}
              className="absolute top-6 left-2.5 h-[252px] w-[180px]"
              initial={false}
              animate={
                reduced
                  ? pose
                  : {
                      x: [pose.x, pose.x * 0.2, pose.x],
                      y: [pose.y, 20, pose.y],
                      rotate: [pose.rotate, -pose.rotate / 2, pose.rotate],
                    }
              }
              transition={
                reduced ? undefined : { ...SHUFFLE, delay: index * 0.2 }
              }
            >
              <ShuffleCard partner={id} front={false} />
            </motion.div>
          );
        })}
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={
            reduced ? { rotate: -3 } : { rotate: [-3, 3, -3], y: [0, -8, 0] }
          }
          transition={reduced ? undefined : SHUFFLE}
        >
          <ShuffleCard partner={partner} front />
        </motion.div>
      </div>

      <h1 className="mt-10 text-xl font-bold text-foreground">
        {t('generating.title')}
      </h1>
      <ol className="mt-4 flex flex-col gap-1.5">
        {steps.map((label, index) => (
          <StepRow
            key={label}
            label={label}
            status={toStepStatus(index, step)}
          />
        ))}
      </ol>
      {/* 단계가 넘어가도 목록 글자는 그대로라 읽히지 않는다 — 지금 단계만 따로 읽어 준다 */}
      <p className="sr-only" aria-live="polite">
        {steps[step]}
      </p>
    </div>
  );
};
