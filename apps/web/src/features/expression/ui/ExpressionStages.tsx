'use client';

// 대화가 끝나고 표현이 나오기까지의 세 장면 — 축하 → 만드는 중 → 표현 리스트.
// 시나리오 대화와 스몰톡이 같은 장면을 쓴다. 다른 건 언제 다음 장면으로 넘어가는지뿐이다:
// 시나리오는 표현이 콘텐츠에 이미 있어 정해둔 시간만큼 보여주고, 스몰톡은 서버가 다 만들 때까지 기다린다
import { motion } from 'motion/react';

// 완료 축하를 이 화면이 띄운다 — 완료 직후를 여는 자리가 여기뿐이라 가로 import를 둔다 (widgets 후보)
import { StreakStamp } from '@/features/streak/ui/StreakStamp';
import { Button } from '@/shared/ui/Button';
import { ArrowRightIcon } from '@/shared/ui/Icons';

import { ExpressionList } from './ExpressionList';

// 세 장면이 같은 타이틀 타이포를 공유해야 전환 순간 글자가 튀지 않는다
const TITLE_CLASS =
  'pt-1 text-3xl leading-[1.22] font-black tracking-normal whitespace-pre-line text-foreground';

// 대화 완료 축하 — 만드는 중 화면과 같은 골격(좌상단 타이틀 + 가운데)으로 그려 전환이 매끄럽다.
// 가운데는 오늘 열매가 찍히는 순간이 채운다 — 완료를 매번 같은 폭죽으로 갚으면 며칠째든 감흥이 없다
export const CelebrateStage = () => (
  <motion.div
    className="flex min-h-0 flex-1 flex-col"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, scale: 0.96 }}
    transition={{ duration: 0.25 }}
  >
    <h1 className={TITLE_CLASS}>{'대화 하나를\n잘 완료했어요!'}</h1>
    <StreakStamp />
  </motion.div>
);

// 만드는 중 — 고정 문구 + 가운데 구슬 랜디만 (타이핑 없이 읽을 시간만 준다). 랜디는 톡 튀어 나타나 둥실둥실 떠 있는다
export const AnalyzeStage = () => (
  <motion.div
    className="flex min-h-0 flex-1 flex-col"
    exit={{ opacity: 0, scale: 0.94 }}
    transition={{ duration: 0.28 }}
  >
    <h1 className={TITLE_CLASS}>
      {'방금 대화를 분석해\n표현 학습을 만들고 있어요'}
    </h1>
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

// 리빌 — '만들고 있어요' 타이틀 자리에 결과 문구(개수만 강조)가 서고 리스트가 타타탁 붙는다
export const RevealStage = ({
  count,
  name,
  expressions,
  onSelect,
  onLearn,
}: {
  count: number;
  name: string;
  expressions:
    React.ComponentProps<typeof ExpressionList>['expressions'] | null;
  onSelect: (expressionId: number) => void;
  onLearn: () => void;
}) => (
  <motion.div
    className="flex min-h-0 flex-1 flex-col"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
  >
    <p className="pt-1 text-xl leading-snug font-extrabold text-foreground">
      {count > 0 ? (
        <>
          원어민이 될 수 있는 표현 <span className="text-primary">{count}</span>
          개를 찾았어요
        </>
      ) : (
        `${name}님을 위한 표현을 준비했어요`
      )}
    </p>
    <div className="-mx-6 mt-4 min-h-0 flex-1 overflow-y-auto">
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
        첫 표현부터 배워볼게요
        <ArrowRightIcon size={16} />
      </Button>
    </div>
  </motion.div>
);
