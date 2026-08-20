// 질문 카드 — 상대 발화가 말하는 속도에 맞춰 글자가 생성되듯 촤르륵 나타나고, 끝나면 해석을 펼쳐볼 수 있다.
// 말풍선은 발화 길이만큼만 차지한다 — 짧은 말에 큰 풍선이 붙으면 어색하고, 내 답변과의 사이는 비어도 괜찮다.
// 크기는 발화가 시작될 때 한 번에 잡는다 — 글자가 나타나는 내내 커지면 화면이 계속 달라져 산만하다.
// 남은 자리를 다 쓰는 긴 발화만 안쪽 글자가 스크롤된다.
// 해석은 접어 두는 게 기본이다 — 늘 펼쳐 두면 카드가 그만큼 길어져 작은 화면에서 발화가 잘린다
'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { ChevronRightIcon } from '@/shared/ui/Icons';

import { speechTypingMs } from '../../model/pacing';
import { TypingCursor } from './TypingCursor';

interface QuestionCardProps {
  question: string;
  translation: string | null;
  speaking: boolean;
  // USER 선발화 안내 — 발화 카드가 아니라 '내가 먼저 말해보는 상황' 라벨 + 작은 설명 구조로 그린다
  instruction?: boolean;
  // 해석을 펼치거나 접은 순간 — 계측은 세션·턴을 아는 화면이 맡는다
  onTranslationToggled?: (opened: boolean) => void;
}

export const QuestionCard = ({
  question,
  translation,
  speaking,
  instruction = false,
  onTranslationToggled,
}: QuestionCardProps) => {
  // 진행값이 어느 질문 것인지 함께 저장한다 — 질문이 바뀐 첫 프레임에 이전 값이 새어 나오지 않도록
  const [typed, setTyped] = useState({ question, count: 0 });
  const count = typed.question === question ? typed.count : 0;
  // 펼침도 어느 질문 것인지 함께 저장한다 — 다음 질문은 다시 접힌 채로 시작한다
  const [opened, setOpened] = useState({ question, on: false });
  const translationOpen = opened.question === question && opened.on;
  // 가려진 글이 위·아래에 있는지 — 있는 쪽 변을 흐려 "더 있다"를 알린다. 질문이 바뀌면 처음으로 돌아간다
  const [edges, setEdges] = useState({ question, above: false, below: false });
  const hasMoreAbove = edges.question === question && edges.above;
  const hasMoreBelow = edges.question === question && edges.below;
  const scrollRef = useRef<HTMLDivElement>(null);
  const translationRef = useRef<HTMLDivElement>(null);

  const syncEdges = () => {
    const box = scrollRef.current;
    if (!box) return;
    const above = box.scrollTop > 1;
    const below = box.scrollTop + box.clientHeight < box.scrollHeight - 1;
    // 값이 그대로면 이전 state를 반환해 스크롤·타이핑 프레임마다의 불필요한 리렌더를 막는다
    setEdges((prev) =>
      prev.question === question && prev.above === above && prev.below === below
        ? prev
        : { question, above, below },
    );
  };

  const toggleTranslation = () => {
    const next = !translationOpen;
    setOpened({ question, on: next });
    onTranslationToggled?.(next);
  };

  // 해석이 펼쳐지는 매 프레임마다 해석 시작점을 위로 맞춘다 — 다 펼친 뒤에 따로 스크롤하면
  // 펼침과 이동이 두 동작으로 끊겨 보인다. 같이 움직여야 한 동작으로 읽힌다.
  // 말풍선이 자라는 짧은 발화에선 스크롤할 게 없어 아무 일도 일어나지 않는다
  const followTranslation = () => {
    const box = scrollRef.current;
    const start = translationRef.current;
    if (!translationOpen || !box || !start) return;
    const offset =
      start.getBoundingClientRect().top - box.getBoundingClientRect().top;
    if (Math.abs(offset) > 0.5) box.scrollTop += offset;
  };

  const revealTranslation = () => {
    followTranslation();
    syncEdges();
  };

  useEffect(() => {
    if (!speaking) return;
    const chars = question.length;
    const duration = speechTypingMs(question);
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const count = Math.ceil(t * chars);
      // 글자 수가 그대로면 이전 state를 반환해 프레임마다의 불필요한 리렌더를 막는다
      setTyped((prev) =>
        prev.question === question && prev.count === count
          ? prev
          : { question, count },
      );
      // 말하는 속도를 따라간다 — 카드보다 긴 발화도 지금 말하는 줄이 늘 보이게
      scrollRef.current?.scrollTo?.({
        top: scrollRef.current.scrollHeight,
        behavior: 'instant',
      });
      syncEdges();
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- syncEdges는 매 렌더 새로 만들어져 넣으면 타이핑이 재시작된다
  }, [speaking, question]);

  // 발화가 끝나면 처음으로 되돌린다 — 읽기 시작할 땐 첫 줄부터 보여야 한다. 새 질문이 올 때도 같다
  useEffect(() => {
    if (speaking) return;
    scrollRef.current?.scrollTo?.({ top: 0, behavior: 'instant' });
    syncEdges();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 위와 같은 이유
  }, [speaking, question]);

  // 발화 중이 아니면 무조건 전문 — 유저 선발화 안내 카드, 그리고 rAF가 끊긴 채(백그라운드 탭) 발화가 끝난 경우의 복구
  const visibleCount = speaking ? count : question.length;
  const typing = speaking && visibleCount < question.length;
  const done = visibleCount >= question.length;

  // 가려진 쪽 변만 투명하게 시작·끝나는 그라데이션. 양쪽 다 보이면 마스크를 걸지 않는다
  const fade =
    hasMoreAbove || hasMoreBelow
      ? `linear-gradient(to bottom, ${hasMoreAbove ? 'transparent' : '#000'}, #000 1.5rem, #000 calc(100% - 1.5rem), ${hasMoreBelow ? 'transparent' : '#000'})`
      : undefined;

  // 질문이 길수록 글자를 줄여 줄 수를 낮춘다 — 답변·마이크 공간 압박을 덜고, 스크롤과 함께 가독성을 지킨다
  const questionSize =
    question.length > 320
      ? 'text-[15px]'
      : question.length > 240
        ? 'text-[16px]'
        : question.length > 180
          ? 'text-[17px]'
          : question.length > 100
            ? 'text-[19px]'
            : 'text-[20px]';

  return (
    <motion.div
      key={question}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex max-h-full w-full flex-col rounded-[28px] rounded-tl-md bg-card px-5 py-5 shadow-lg shadow-black/5"
    >
      <div
        ref={scrollRef}
        onScroll={syncEdges}
        // 가려진 쪽만 흐린다 — 클래스로는 calc이 섞인 이 그라데이션을 조건부로 못 만든다
        style={{ maskImage: fade, WebkitMaskImage: fade }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {instruction ? (
          // 선발화 안내 — 상대 발화처럼 크게 꽂지 않고, 라벨 + 차분한 크기의 상황 설명으로 정리한다
          <>
            <p className="text-sm font-bold text-primary">
              내가 먼저 말해보는 상황
            </p>
            <p className="mt-2 text-[17px] leading-relaxed font-semibold text-foreground">
              {question}
            </p>
          </>
        ) : (
          <p
            className={`${questionSize} leading-snug font-bold text-foreground`}
          >
            {question.slice(0, visibleCount)}
            {typing && <TypingCursor />}
            {/* 아직 안 나온 글자를 투명하게 깔아 첫 프레임부터 최종 높이를 잡는다 —
                말풍선이 글자 따라 커지면 발화 내내 화면이 계속 달라진다 */}
            {typing && (
              <span className="text-transparent">
                {question.slice(visibleCount)}
              </span>
            )}
          </p>
        )}
        <AnimatePresence initial={false}>
          {!instruction && translation && done && translationOpen && (
            <motion.div
              key="translation"
              ref={translationRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onUpdate={followTranslation}
              onAnimationComplete={revealTranslation}
              className="overflow-hidden"
            >
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {translation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* 카드 오른쪽 아래에 붙박이 — 글이 길어 안쪽이 스크롤돼도 이 버튼은 늘 같은 자리에 있다 */}
      {!instruction && translation && done && (
        <div className="-mr-2 -mb-3 flex flex-none justify-end">
          <button
            onClick={toggleTranslation}
            className="flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold text-muted-foreground active:scale-95"
          >
            {translationOpen ? '해석 접기' : '해석 보기'}
            <ChevronRightIcon
              size={14}
              className={translationOpen ? '-rotate-90' : 'rotate-90'}
            />
          </button>
        </div>
      )}
    </motion.div>
  );
};
