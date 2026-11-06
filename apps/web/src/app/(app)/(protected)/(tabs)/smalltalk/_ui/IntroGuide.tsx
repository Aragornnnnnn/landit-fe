// 첫 진입 안내 — 어둠 위에서 래디가 큰 글씨로 두 문장을 말하고(튜토리얼과 같은 모양), 이어 표현 프리뷰처럼
// 화면의 실제 자리(받은 무료 시간 알약)를 비춘다. 튜토리얼처럼 화면을 눌러야 넘어가고(저절로 넘어가지 않는다),
// 비춘 자리에서 한 번 더 누르면 닫힌다. 비추는 자리는 페이지가 어둠 위로 올려 말풍선을 붙인다
'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

// 가로 import 사유: 첫 문장 위에 세 친구의 얼굴을 나란히 띄운다
import { PartnerAvatar } from '@/features/conversation/ui/character/PartnerAvatar';
import { PARTNERS } from '@/features/small-talk/model/partner';
import { Button } from '@/shared/ui/Button';

import type { IntroSentence, IntroSpotlight } from '../_model/intro-sentences';
// 시나리오 탭 튜토리얼과 같은 타이핑 규칙(쓰고, 누르면 지우고, 다음 문장)을 쓴다
import {
  INITIAL_TYPING,
  revealTyping,
  tapTyping,
  tickTyping,
} from '../../_model/tutorial-typing';

// 한 자 쓰는 간격과 한 자 지우는 간격(ms) — 튜토리얼과 같다
const TYPE_MS = 55;
const ERASE_MS = 16;

// 앞에서부터 count자만 남긴 조각들
const sliceParts = (parts: IntroSentence['parts'], count: number) => {
  let left = count;
  return parts.flatMap(([text, highlight]) => {
    if (left <= 0) return [];
    const shown = text.slice(0, left);
    left -= text.length;
    return [[shown, highlight] as const];
  });
};

export const IntroGuide = ({
  sentences,
  spotlights,
  spot,
  onNext,
  onClose,
}: {
  sentences: IntroSentence[];
  // 래디의 말 뒤에 차례로 비출 자리. 비울 수도 있다(한도를 다 써 버튼이 없는 날)
  spotlights: IntroSpotlight[];
  // 몇 번째 자리를 비추는 중인가 — null이면 아직 래디 차례. 비춘 자리를 눌러 넘기는 건 페이지라 페이지가 쥔다
  spot: number | null;
  // 다음 자리로 — 래디의 말이 끝났거나 비춘 자리를 다 읽었다
  onNext: () => void;
  onClose: () => void;
}) => {
  const t = useTranslations('smallTalk.introGuide');
  const reduced = useReducedMotion();
  // 문장은 처음 뜬 그대로 쓴다 — 쓰는 도중 문장이 바뀌면 글자 수가 어긋난다
  const [shown] = useState({ sentences });
  const lengths = shown.sentences.map(({ parts }) =>
    parts.reduce((sum, [text]) => sum + text.length, 0),
  );
  const [typing, setTyping] = useState(INITIAL_TYPING);
  const spotlight = spot === null ? null : (spotlights[spot] ?? null);
  const sentence = shown.sentences[typing.index];

  // 시계 — 쓰는 중·지우는 중에만 돈다. 동작 줄이기면 문장을 한 번에 보여 준다
  const skip = (reduced ?? false) && typing.phase === 'typing';
  const tick = useEffectEvent(() =>
    setTyping((state) =>
      skip ? revealTyping(state, lengths) : tickTyping(state, lengths),
    ),
  );
  useEffect(() => {
    if (spot !== null || typing.phase === 'shown') return;
    const delay = skip ? 0 : typing.phase === 'typing' ? TYPE_MS : ERASE_MS;
    const timer = setTimeout(tick, delay);
    return () => clearTimeout(timer);
  }, [typing, skip, spot]);

  const lastSentence = typing.index === shown.sentences.length - 1;
  const talkDone = lastSentence && typing.phase === 'shown';
  // 다음으로 — 래디 문장 중이면 다음 문장, 말이 끝났으면 훅에 넘긴다(다음 자리를 비출지 닫을지는 훅이 정한다)
  const next = () => {
    if (spot === null && !talkDone) {
      setTyping((state) => tapTyping(state, lengths));
      return;
    }
    // 비출 자리 없이 말이 끝났으면 확인 버튼으로만 닫는다
    if (spot === null && spotlights.length === 0) return;
    onNext();
  };
  // 비출 자리 없이 말이 끝났다 — 확인 버튼으로 닫는다
  const confirmDue = talkDone && spotlights.length === 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center px-6 pt-[max(var(--safe-area-inset-top),10px)] pb-[max(var(--safe-area-inset-bottom),24px)]"
      role="dialog"
      aria-modal="true"
      aria-label={t('dialogLabel')}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* 래디가 말할 땐 뒤의 소개 카드 글자가 비쳐 문장과 엉키지 않게 짙게, 자리를 비출 땐 화면이 보이게 표현 프리뷰만큼 덮는다 */}
      {/* rAF가 멎는 웹뷰에서도 끝까지 가게 CSS로 바꾼다 (LAN-375) */}
      <div
        aria-hidden
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          spot === null ? 'opacity-90' : 'opacity-[0.62]'
        }`}
      />
      {/* 화면 전체가 「다음」 버튼이다 — 비춘 자리(어둠 위로 올라온 것)는 이 버튼 위라 그대로 눌린다 */}
      {!confirmDue && (
        <button
          ref={(button) => button?.focus()}
          type="button"
          aria-label={t('nextLabel')}
          className="absolute inset-0"
          onClick={next}
        />
      )}

      {spot === null && (
        <>
          <div className="pointer-events-none relative flex w-full flex-1 flex-col items-center justify-center">
            {/* 래디 한 장과 세 친구 얼굴이 같은 높이 칸을 쓴다 — 바뀔 때 문장이 출렁이지 않게 */}
            <div className="relative h-36 w-full cq-tiny:h-24">
              <AnimatePresence initial={false}>
                {'partners' in sentence ? (
                  <motion.div
                    key="partners"
                    className="absolute inset-0 flex items-center justify-center gap-3"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25 }}
                  >
                    {PARTNERS.map((friend, i) => (
                      // 한 명씩 차례로 톡톡 튀어나온다 — 셋이라는 게 눈에 세어진다
                      <motion.span
                        key={friend.id}
                        className="size-24 overflow-hidden rounded-full border-[3px] border-white/90 bg-white cq-tiny:size-16"
                        initial={{ y: 12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{
                          delay: 0.1 + i * 0.12,
                          type: 'spring',
                          stiffness: 380,
                          damping: 20,
                        }}
                      >
                        <PartnerAvatar
                          partner={friend.id}
                          viewBox={friend.avatarViewBox}
                          className="size-full"
                        />
                      </motion.span>
                    ))}
                  </motion.div>
                ) : (
                  <motion.img
                    key={sentence.image}
                    src={sentence.image}
                    alt={t('mascotLabel')}
                    className="absolute inset-0 mx-auto size-36 object-contain cq-tiny:size-24"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25 }}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* 높이를 세 줄로 잡아 둔다 — 글자가 늘고 줄 때 래디가 출렁이지 않게. 다 쓴 문장만 아래 숨은 칸이 읽는다 */}
            <p
              aria-hidden
              className="mt-5 min-h-[3lh] text-center text-25 leading-[1.45] font-extrabold break-keep whitespace-pre-line text-white cq-tiny:text-xl"
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
            {confirmDue ? (
              <div className="pointer-events-auto">
                <Button onClick={onClose}>{t('confirmButton')}</Button>
              </div>
            ) : (
              typing.phase === 'shown' && (
                <p className="pt-3 text-center text-lg font-bold text-white/85">
                  {t('continueCaption')}
                </p>
              )
            )}
          </div>
        </>
      )}

      {/* 비춘 자리를 읽는 동안도 어디를 눌러야 넘어가는지 알린다 */}
      {spotlight !== null && (
        <p className="pointer-events-none relative mt-auto h-14 pt-3 text-center text-lg font-bold text-white/85">
          {t('continueCaption')}
        </p>
      )}
    </motion.div>
  );
};
