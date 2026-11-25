// 지금 차례의 상대 말풍선 — 상대 발화가 말하는 속도에 맞춰 글자가 생성되듯 촤르륵 나타나고, 끝나면 해석을 펼쳐보거나 그 발화를 다시 들을 수 있다.
// 맨 위엔 내 말에 대한 상대 속마음이 회색 기울임 한 줄로 붙는다 — 늦게 오면 뼈대로 자리를 잡아 두었다가 채운다.
// 말풍선 크기는 발화가 시작될 때 한 번에 잡는다 — 글자가 나타나는 내내 커지면 대화 칸이 계속 출렁여 산만하다.
// 긴 발화도 안쪽에서 스크롤하지 않는다 — 대화 칸이 통째로 스크롤되며, 말하는 줄을 따라가는 일은 칸(scroll)에 맡긴다.
// 해석은 접어 두는 게 기본이다 — 늘 펼쳐 두면 말풍선이 그만큼 길어져 작은 화면에서 지난 대화가 금방 밀려난다
// 영어 문장을 가리면 흐리게 덮어 듣기만으로 연습하게 한다. 흐린 글자나 눈 버튼을 누르면 그 말풍선만 보인다
'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { getSpeechRate } from '@/shared/lib/speech-rate';
import { EyeIcon, SpeakerIcon, TranslateIcon } from '@/shared/ui/Icons';

import { speechTypingMs } from '../../model/pacing';
import type { BubbleThought } from '../../model/thought';
import type { ReplayControl } from '../../model/useConversationTurns';
import { PartnerBubbleShell } from './ChatBubbles';
import { useChatScroll } from './ConversationLog';
import { TypingCursor } from './TypingCursor';

interface PartnerBubbleProps {
  question: string;
  translation: string | null;
  speaking: boolean;
  // USER 선발화 안내 — 발화가 아니라 '내가 먼저 말해보는 상황' 라벨 + 설명 구조로 그린다
  instruction?: boolean;
  // 해석을 펼치거나 접은 순간 — 계측은 세션·턴을 아는 화면이 맡는다
  onTranslationToggled?: (opened: boolean) => void;
  // 다시 듣기 — 주면 스피커 버튼이 붙는다
  replay?: ReplayControl;
  // 마지막 질문 — 대사 위에 머리말을 붙여 끝이 보이게 한다
  lastQuestion?: boolean;
  // 해석을 펼친 채로 시작할지 — 새 질문마다 이 값으로 돌아간다
  translationDefaultOpen?: boolean;
  // 영어 문장을 가린 채로 시작할지 — 새 질문마다 이 값으로 돌아간다
  textHidden?: boolean;
  // 이 말풍선의 영어 문장을 보이거나 가린 순간 — 계측은 세션·턴을 아는 화면이 맡는다
  onTextToggled?: (visible: boolean) => void;
  // 내 말에 대한 상대 속마음 — 오는 중이면 뼈대, 없으면(속마음 없는 대화·생성 실패) 줄 자체를 두지 않는다
  thought?: BubbleThought | null;
}

/**
 * 말풍선 맨 위 속마음 줄 — 대사와 구분되게 작은 회색 기울임으로, 길어도 두 줄까지만.
 * 오는 중이면 한 줄 높이 뼈대를 둬서, 도착해도 대사가 크게 밀려 내려가지 않게 한다
 */
const ThoughtLine = ({ thought }: { thought: BubbleThought }) => {
  const t = useTranslations('conversation.partnerBubble');
  return (
    <>
      {thought.status === 'shown' ? (
        <p className="line-clamp-2 text-13 leading-normal break-words text-muted-foreground italic">
          {thought.text}
        </p>
      ) : (
        <span
          role="status"
          aria-label={t('thoughtLoadingLabel')}
          className="flex h-[1.5em] items-center text-13"
        >
          <span className="h-2.5 w-3/4 animate-pulse rounded-full bg-border" />
        </span>
      )}
      <hr className="border-border" />
    </>
  );
};

/**
 * 말풍선 아래 동그란 아이콘 버튼 — 켜진 상태(재생 중·해석 펼침)는 색을 뒤집어 알린다.
 * 발음 화면의 듣기 버튼과 같은 문법이라 앱 전체에서 "누르면 뭔가 나온다"가 한 모양으로 읽힌다.
 */
const BubbleIconButton = ({
  on,
  label,
  disabled = false,
  onClick,
  children,
}: {
  on: boolean;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className={`flex size-7 flex-none items-center justify-center rounded-full transition-colors active:opacity-70 disabled:opacity-40 ${
      on ? 'bg-foreground text-background' : 'bg-secondary text-foreground'
    }`}
  >
    {children}
  </button>
);

export const PartnerBubble = ({
  question,
  translation,
  speaking,
  instruction = false,
  onTranslationToggled,
  replay,
  lastQuestion = false,
  translationDefaultOpen = false,
  textHidden = false,
  onTextToggled,
  thought = null,
}: PartnerBubbleProps) => {
  const t = useTranslations('conversation.partnerBubble');
  // 대화 칸 스크롤 — 말하는 줄과 펼친 해석을 보이게 하고, 다 말하면 첫 줄로 돌려 달라고 부탁한다
  const scroll = useChatScroll();
  // 진행값이 어느 질문 것인지 함께 저장한다 — 질문이 바뀐 첫 프레임에 이전 값이 새어 나오지 않도록
  const [typed, setTyped] = useState({ question, count: 0 });
  const count = typed.question === question ? typed.count : 0;
  // 펼침은 이 말풍선에서 직접 누른 값만 질문과 함께 저장한다 — 누르기 전엔 기본값을 따르므로,
  // 저장된 기본값이 첫 렌더 뒤에 들어와도 반영된다. 다음 질문은 다시 기본값으로 시작한다
  const [opened, setOpened] = useState<{
    question: string;
    on: boolean;
  } | null>(null);
  const translationOpen =
    opened?.question === question ? opened.on : translationDefaultOpen;
  // 글자 보임도 해석 펼침과 같은 규칙 — 이 말풍선에서 직접 바꾼 값만 저장하고, 다음 질문은 다시 기본값으로 시작한다
  const [shown, setShown] = useState<{ question: string; on: boolean } | null>(
    null,
  );
  const blurred = !(shown?.question === question ? shown.on : !textHidden);
  const translationRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  const toggleText = () => {
    setShown({ question, on: blurred });
    onTextToggled?.(blurred);
  };

  const toggleTranslation = () => {
    const next = !translationOpen;
    setOpened({ question, on: next });
    onTranslationToggled?.(next);
  };

  // 해석이 펼쳐지는 매 프레임 그 끝을 칸 안에 둔다 — 다 펼친 뒤에 따로 내리면 펼침과 이동이 두 동작으로 끊겨 보인다
  const followTranslation = () => {
    if (translationOpen && translationRef.current)
      scroll?.follow(translationRef.current);
  };

  useEffect(() => {
    if (!speaking) return;
    const chars = question.length;
    // 글자가 나타나는 속도도 말하기 속도를 따른다 — 안 그러면 느리게 골랐을 때 글자가 음성보다 먼저 끝난다
    const duration = speechTypingMs(question, getSpeechRate());
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
      // 말하는 줄이 칸 아래로 넘어가면 칸이 따라 내려간다 — 안 나온 글자 끝이 아니라 커서가 기준이다
      if (cursorRef.current) scroll?.follow(cursorRef.current);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scroll은 렌더마다 새 객체라 넣으면 타이핑이 재시작된다
  }, [speaking, question]);

  // 다 말하면 첫 줄로 돌아간다 — 읽기 시작할 땐 첫 줄부터 보여야 한다
  useEffect(() => {
    if (!speaking) scroll?.settle();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 위와 같은 이유
  }, [speaking]);

  // 발화 중이 아니면 무조건 전문 — 유저 선발화 안내, 그리고 rAF가 끊긴 채(백그라운드 탭) 발화가 끝난 경우의 복구
  const spokenCount = speaking ? count : question.length;
  // 버튼이 나오는 때는 가림과 상관없이 발화를 따른다
  const done = spokenCount >= question.length;
  // 가린 동안엔 글자가 나타나는 모습이 안 보이니 전문을 한 번에 흐리게 둔다 — 흐림을 매 프레임 다시 그리지 않게
  const visibleCount = blurred ? question.length : spokenCount;
  const typing = speaking && visibleCount < question.length;

  return (
    <motion.div
      key={question}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      // 왼쪽 위 꼬리 쪽에서 커져 나온다 — 상대가 말을 꺼내는 쪽
      style={{ transformOrigin: 'top left' }}
      className="self-start"
    >
      <PartnerBubbleShell>
        {!instruction && thought && <ThoughtLine thought={thought} />}
        {lastQuestion && (
          <p className="text-xs font-bold text-primary">
            {t('lastQuestionBadge')}
          </p>
        )}
        {instruction ? (
          // 선발화 안내 — 상대 발화처럼 굵게 꽂지 않고, 라벨 + 차분한 상황 설명으로 정리한다
          <>
            <p className="text-sm font-bold text-primary">
              {t('instructionCaption')}
            </p>
            <p className="text-16 leading-[1.35] font-semibold text-foreground">
              {question}
            </p>
          </>
        ) : (
          <p
            data-hidden={blurred}
            // 가린 동안엔 화면 낭독기도 읽지 않는다 — 눈 버튼("영어 문장 보기")으로 같은 동작을 할 수 있다
            aria-hidden={blurred || undefined}
            onClick={blurred ? toggleText : undefined}
            // 흐림은 filter가 아니라 글자 그림자로 만든다 — iOS는 filter를 그때그때 다른 경로로 그려 흐린 정도가 번쩍이고 경계가 네모로 잘린다
            className={`text-16 leading-[1.35] font-bold break-words transition-[color,text-shadow] duration-200 ${
              blurred
                ? 'cursor-pointer text-transparent select-none [text-shadow:0_0_10px_var(--color-foreground)]'
                : 'text-foreground'
            }`}
          >
            {question.slice(0, visibleCount)}
            {typing && <TypingCursor ref={cursorRef} />}
            {/* 아직 안 나온 글자를 투명하게 깔아 첫 프레임부터 최종 크기를 잡는다 —
                말풍선이 글자 따라 커지면 발화 내내 대화 칸이 계속 달라진다 */}
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
              onAnimationComplete={followTranslation}
              className="overflow-hidden"
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                {translation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        {/* 눈 버튼은 가린 동안에도 늘 누를 수 있어야 해서 이 줄은 발화가 끝나길 기다리지 않는다 */}
        {!instruction && (
          <div className="-mr-1.5 flex justify-end gap-1.5">
            {done && replay && (
              <BubbleIconButton
                on={replay.playing}
                disabled={!replay.enabled}
                label={
                  replay.playing ? t('stopReplayButton') : t('replayButton')
                }
                onClick={replay.toggle}
              >
                <SpeakerIcon size={14} />
              </BubbleIconButton>
            )}
            {done && translation && (
              <BubbleIconButton
                on={translationOpen}
                label={
                  translationOpen
                    ? t('hideTranslationButton')
                    : t('showTranslationButton')
                }
                onClick={toggleTranslation}
              >
                <TranslateIcon size={14} />
              </BubbleIconButton>
            )}
            {/* 이 말풍선의 글자 보기 스위치 — 글자가 보이면 칠한다. 아이콘은 하나로 둔다 */}
            <BubbleIconButton
              on={!blurred}
              label={blurred ? t('showTextButton') : t('hideTextButton')}
              onClick={toggleText}
            >
              <EyeIcon size={14} />
            </BubbleIconButton>
          </div>
        )}
      </PartnerBubbleShell>
    </motion.div>
  );
};
