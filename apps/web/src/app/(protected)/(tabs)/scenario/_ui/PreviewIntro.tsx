'use client';

// 프리미엄 프리뷰의 튜토리얼 — 동전 연출의 어둠을 그대로 두고, 가운데 래디 아래로 문장을 한 자씩 타이핑한다.
// 화면을 누르면 지금 문장을 지우고 다음 문장을 쓴다. 마지막 문장 뒤의 버튼이 카드를 뒤집으러 간다
import { useEffect, useEffectEvent, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

// 가로 import 사유: 칸이 넘어가는 진동 세기를 알람 시각 바퀴와 같은 기준(플랫폼)으로 고른다
import { alarmPlatform } from '@/features/alarm/model/shell-alarm';
import { track } from '@/shared/analytics';
import { haptic } from '@/shared/haptics';
import { formatWon } from '@/shared/lib/won';
import { Button } from '@/shared/ui/Button';

import { partsOf, type Part } from '../../_model/tutorial-sentence';
import {
  INITIAL_TYPING,
  revealTyping,
  tapTyping,
  tickTyping,
} from '../../_model/tutorial-typing';

// 한 자 쓰는 간격과 한 자 지우는 간격(ms) — 지우기는 빨라야 기다림으로 안 느껴진다
const TYPE_MS = 55;
const ERASE_MS = 16;

// 한 자 쓸 때의 진동 — Android의 selection은 너무 약해 거의 안 느껴져서 한 단계 센 light를 쓴다
const typeHaptic = () =>
  alarmPlatform() === 'android' ? ('light' as const) : ('selection' as const);

const tickDelayOf = (phase: 'typing' | 'erasing', skip: boolean) => {
  if (skip) return 0;
  if (phase === 'typing') return TYPE_MS;
  return ERASE_MS;
};

type Sentence = { image: string; parts: Part[] };

// 맞춤 표현을 열어 주는 마지막 문장 — 환급을 팔든 안 팔든 튜토리얼은 이 문장으로 끝나 무료 표현으로 이어진다
const freeExpressionSentenceOf = (raw: string): Sentence => ({
  image: '/images/character/landy-point.webp',
  parts: partsOf(raw),
});

// 환급을 팔지 않는 화면(일본어)은 적립 대신 매일 받는 시나리오를 소개한다
const plainSentencesOf = (dailyRaw: string, freeRaw: string): Sentence[] => [
  { image: '/images/character/landy-good.webp', parts: partsOf(dailyRaw) },
  freeExpressionSentenceOf(freeRaw),
];

// 한국어 화면에만 있어 옮기지 않는다 — 환급을 파는 화면의 적립 소개
const rewardSentencesOf = (dailyWon: number, freeRaw: string): Sentence[] => [
  {
    image: '/images/character/landy-good.webp',
    parts: [
      ['프리미엄 유저라면\n방금처럼 대화를 끝낼 때마다\n'],
      [formatWon(dailyWon), true],
      ['을 받을 수 있어요'],
    ],
  },
  {
    image: '/images/character/landy-genie.webp',
    parts: [
      ['프리미엄 이용이 끝나면\n그동안 모은 돈이\n'],
      ['내 계좌로 들어와요', true],
    ],
  },
  freeExpressionSentenceOf(freeRaw),
];

const plainTextOf = (parts: readonly Part[]) =>
  parts.map(([text]) => text).join('');

const lengthOf = (parts: readonly Part[]) =>
  parts.reduce((sum, [text]) => sum + text.length, 0);

// 앞에서부터 count자만 남긴 조각들
const sliceParts = (parts: readonly Part[], count: number) => {
  let left = count;
  return parts.flatMap(([text, highlight]) => {
    if (left <= 0) return [];
    const shown = text.slice(0, left);
    left -= text.length;
    return [[shown, highlight] as const];
  });
};

export const PreviewIntro = ({
  dailyWon,
  onDone,
}: {
  /** 대화 한 번에 쌓이는 환급액. 환급을 팔지 않으면 null이고 적립 문장을 빼고 소개한다 */
  dailyWon: number | null;
  onDone: () => void;
}) => {
  const t = useTranslations('scenario.previewIntro');
  const reduced = useReducedMotion();
  // 금액은 처음 뜬 값으로 고정한다 — 쓰는 도중 가격이 도착해 글자 수가 바뀌면 문장이 잘린다
  const [won] = useState(dailyWon);
  // 한 자씩 쓰려면 태그가 남은 원문이 필요하다 — 조각은 partsOf가 만든다
  const freeRaw: string = t.raw('freeExpressionBody');
  const sentences =
    won === null
      ? plainSentencesOf(t.raw('dailyScenarioBody'), freeRaw)
      : rewardSentencesOf(won, freeRaw);
  const lengths = sentences.map(({ parts }) => lengthOf(parts));
  const [typing, setTyping] = useState(INITIAL_TYPING);

  // 시계 — 쓰는 중·지우는 중에만 돈다. 동작 줄이기면 쓰는 단계를 건너뛰고 문장을 한 번에 보여 준다
  const skip = (reduced ?? false) && typing.phase === 'typing';
  const advance = useEffectEvent(() => {
    // 한 자씩 쓸 때만 타자 치듯 진동한다 — 빈칸·줄바꿈엔 울리지 않고, 한 번에 보여 줄 때와 지울 때도 조용하다
    if (!skip && typing.phase === 'typing') {
      const next = plainTextOf(sentences[typing.index].parts)[typing.count];
      if (next && next.trim()) haptic(typeHaptic());
    }
    setTyping((state) =>
      skip ? revealTyping(state, lengths) : tickTyping(state, lengths),
    );
  });
  useEffect(() => {
    if (typing.phase === 'shown') return;
    const timer = setTimeout(advance, tickDelayOf(typing.phase, skip));
    return () => clearTimeout(timer);
  }, [typing, skip]);

  const sentence = sentences[typing.index];
  const last = typing.index === sentences.length - 1;
  const done = last && typing.phase === 'shown';
  const tapNext = () => {
    // 다 쓴 문장을 넘길 때만 — 쓰는 중의 누름은 무시된다
    if (typing.phase === 'shown' && !last) {
      track(EVENTS.PREMIUM_PREVIEW_INTRO_ADVANCED, {
        sentence_index: typing.index,
      });
    }
    setTyping((state) => tapTyping(state, lengths));
  };
  const finish = () => {
    track(EVENTS.PREMIUM_PREVIEW_INTRO_COMPLETED);
    onDone();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center px-6 pt-[max(var(--safe-area-inset-top),10px)] pb-[max(var(--safe-area-inset-bottom),24px)]"
      role="dialog"
      aria-modal="true"
      aria-label={t('dialogLabel')}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div aria-hidden className="absolute inset-0 bg-black/80" />
      {/* 화면 전체가 「다음」 버튼이다 — 손가락으로는 어디를 눌러도, 키보드로는 이 버튼으로 넘긴다 */}
      {!done && (
        <button
          // 뜨자마자 포커스를 받는다 — 키보드로 바로 넘길 수 있고 뒤에 깔린 헤더가 먼저 잡히지 않게
          ref={(button) => button?.focus()}
          type="button"
          aria-label={t('nextLabel')}
          className="absolute inset-0"
          onClick={tapNext}
        />
      )}

      <div className="pointer-events-none relative flex w-full flex-1 flex-col items-center justify-center">
        {/* 문장마다 래디가 바뀐다 — 글자가 지워지는 사이 살짝 바꿔 끼운다 */}
        <div className="relative size-40">
          <AnimatePresence initial={false}>
            <motion.img
              key={sentence.image}
              src={sentence.image}
              alt={t('characterLabel')}
              className="absolute inset-0 size-full object-contain"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
            />
          </AnimatePresence>
        </div>

        {/* 높이를 세 줄로 잡아 둔다 — 글자가 늘고 줄 때 래디가 위아래로 출렁이지 않게 */}
        {/* 한 자씩 바뀌는 글자는 읽지 않고, 다 쓴 문장만 아래 숨은 칸이 한 번 읽는다 */}
        <p
          aria-hidden
          className="mt-6 min-h-[3lh] text-center text-25 leading-[1.45] font-extrabold break-keep whitespace-pre-line text-white"
        >
          {sliceParts(sentence.parts, typing.count).map(
            ([text, highlight], i) => (
              <span key={i} className={highlight ? 'text-[#ffd25e]' : ''}>
                {text}
              </span>
            ),
          )}
          <span className="ml-0.5 inline-block h-[0.95em] w-[3px] translate-y-[0.12em] animate-pulse bg-[#ffd25e]" />
        </p>
        <p className="sr-only" aria-live="polite">
          {typing.phase === 'shown' &&
            sentence.parts.map(([text]) => text).join('')}
        </p>
      </div>

      <div className="pointer-events-none relative h-14 w-full">
        {done ? (
          <motion.div
            className="pointer-events-auto"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button onClick={finish}>{t('learnButton')}</Button>
          </motion.div>
        ) : (
          typing.phase === 'shown' && (
            <p className="pt-3 text-center text-lg font-bold text-white/85">
              {t('continueCaption')}
            </p>
          )
        )}
      </div>
    </motion.div>
  );
};
