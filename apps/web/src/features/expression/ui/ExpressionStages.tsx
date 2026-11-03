'use client';

// 대화가 끝나고 표현이 나오기까지의 세 장면 — 축하 → 만드는 중 → 표현 리스트.
// 시나리오 대화와 스몰톡이 같은 장면을 쓴다. 다른 건 언제 다음 장면으로 넘어가는지와, 축하에 받은 환급액이 서는지다:
// 시나리오는 표현이 콘텐츠에 이미 있어 정해둔 시간만큼 보여주고, 스몰톡은 서버가 다 만들 때까지 기다린다
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

// 완료 축하를 이 화면이 띄운다 — 완료 직후를 여는 자리가 여기뿐이라 가로 import를 둔다 (widgets 후보)
import { useCompletionEarn } from '@/features/reward/model/useCompletionEarn';
import { EarnedStamp } from '@/features/reward/ui/EarnedStamp';
import { StreakStamp } from '@/features/streak/ui/StreakStamp';
import { lineBreak } from '@/shared/i18n/rich';
import { Button } from '@/shared/ui/Button';
import { ArrowRightIcon } from '@/shared/ui/Icons';

import { ExpressionList } from './ExpressionList';

// 세 장면이 같은 타이틀 타이포를 공유해야 전환 순간 글자가 튀지 않는다. 환급 점검의 미리보기도 같은 글자로 그린다
export const TITLE_CLASS =
  'pt-1 text-3xl leading-[1.22] font-black tracking-normal whitespace-pre-line text-foreground';

// 축하가 머무는 시간 — 열매가 찍히고 숫자가 선 뒤에도 잠깐 남는다. 축하를 띄우는 화면이 이 값을 같이 쓴다
export const CELEBRATE_MS = 2600;

// 대화 완료 축하 — 만드는 중 화면과 같은 골격(좌상단 타이틀 + 가운데)으로 그려 전환이 매끄럽다.
// 가운데는 오늘 열매가 찍히는 순간이 채운다 — 완료를 매번 같은 폭죽으로 갚으면 며칠째든 감흥이 없다.
// 이번 완료로 환급액을 받은 사람에게는 열매 대신 받은 금액을 보여 준다
export const CelebrateStage = ({
  earns = false,
  title,
}: {
  // 방금 끝낸 것이 환급이 쌓이는 대화인가 — 시나리오뿐이다
  earns?: boolean;
  // 대화 이름이 들어간 제목을 쓰는 화면(롤플레이)이 넘긴다. 없으면 「대화 하나를 잘 완료했어요!」
  title?: React.ReactNode;
}) => {
  const t = useTranslations('expression.stages');
  const { earn } = useCompletionEarn({ enabled: earns });

  return (
    <motion.div
      className="flex min-h-0 flex-1 flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
    >
      <h1 className={TITLE_CLASS}>
        {title ?? t.rich('celebrateTitle', lineBreak)}
      </h1>
      {earn ? <EarnedStamp earn={earn} /> : <StreakStamp />}
    </motion.div>
  );
};

// 만드는 중 — 고정 문구 + 가운데 구슬 랜디만 (타이핑 없이 읽을 시간만 준다). 랜디는 톡 튀어 나타나 둥실둥실 떠 있는다
export const AnalyzeStage = () => {
  const t = useTranslations('expression.stages');
  return (
    <motion.div
      className="flex min-h-0 flex-1 flex-col"
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.28 }}
    >
      <h1 className={TITLE_CLASS}>{t.rich('analyzeTitle', lineBreak)}</h1>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, y: [0, -8, 0] }}
          transition={{
            scale: { type: 'spring', stiffness: 420, damping: 18 },
            opacity: { duration: 0.25 },
            y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/character/landy-orb.webp"
            alt=""
            className="object-contain"
            style={{ width: 168, height: 168 }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

// 리빌 — '만들고 있어요' 타이틀 자리에 결과 문구(개수만 강조)가 서고 리스트가 타타탁 붙는다
export const RevealStage = ({
  count,
  nickname,
  expressions,
  onSelect,
  onLearn,
}: {
  count: number;
  // 없으면 "회원님"으로 부른다
  nickname: string | null;
  expressions:
    React.ComponentProps<typeof ExpressionList>['expressions'] | null;
  onSelect: (expressionId: number) => void;
  onLearn: () => void;
}) => {
  const t = useTranslations('expression.stages');
  return (
    <motion.div
      className="flex min-h-0 flex-1 flex-col"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="pt-1 text-xl leading-snug font-extrabold text-foreground">
        {count > 0
          ? t.rich('foundTitle', {
              count,
              emphasis: (chunks) => (
                <span className="text-primary">{chunks}</span>
              ),
            })
          : nickname
            ? t('namedPreparedTitle', { nickname })
            : t('preparedTitle')}
      </p>
      <div className="-mx-6 mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {expressions && (
          <ExpressionList
            expressions={expressions}
            onSelect={onSelect}
            stagger
            hideStartAction
            hideProgress
          />
        )}
      </div>
      <div className="flex flex-none flex-col gap-1 pt-3">
        <Button size="md" onClick={onLearn}>
          {t('learnButton')}
          <ArrowRightIcon size={16} />
        </Button>
      </div>
    </motion.div>
  );
};
