// 지금 차례 내 말풍선 — 대화 칸 오른쪽 아래에서 말하는 중 → 말한 뒤 확인 → 보냄(또는 보내지 못함)으로 모양을 바꾼다.
// 아직 보내지 않은 동안은 흰 바탕에 주황 테두리, 보내면 지난 내 말풍선과 같은 연한 주황으로 굳어 그대로 기록으로 넘어간다
'use client';

import { useEffect, useId, useRef } from 'react';
import { useTranslations } from 'next-intl';

import { PencilIcon } from '@/shared/ui/Icons';

import type { MyBubbleState } from '../../model/my-bubble';
import { useEditHint } from '../../model/useEditHint';
import { MY_BUBBLE_SHAPE } from './ChatBubbles';
import { useChatScroll } from './ConversationLog';
import { ListeningDots } from './ListeningDots';

// 아직 보내지 않은 말풍선의 테두리 — 바깥선을 안쪽으로 그려, 보내서 테두리가 빠져도 말풍선 크기가 그대로다
const LIVE_OUTLINE =
  'bg-card outline-[1.5px] -outline-offset-[1.5px] outline-bubble-mine-live outline-solid';

const BUBBLE_TEXT = 'text-16 leading-[1.35] font-medium break-words';

interface MyBubbleProps {
  state: MyBubbleState;
  text: string;
  // 확정 전 말이 남아 있는가 — 말하는 중에 점을 띄우는 기준
  speechPending?: boolean;
  // 말한 뒤 확인 중에 말풍선을 누르면 — 인식된 문장을 고치는 입력창으로 간다
  onEdit: () => void;
  // 키보드로 쓰다 닫아 남긴 글인가 — 잘못 알아들을 일이 없어 「말한 내용과 다르면」 안내를 띄우지 않는다
  typed?: boolean;
}

export const MyBubble = ({
  state,
  text,
  speechPending = false,
  onEdit,
  typed = false,
}: MyBubbleProps) => {
  const scroll = useChatScroll();
  const ref = useRef<HTMLDivElement>(null);

  // 말이 늘어 말풍선이 칸 아래로 넘치면 방금 한 말이 보이게 칸에 따라 내려와 달라고 한다
  useEffect(() => {
    if (ref.current) scroll?.follow(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 글과 상태가 바뀔 때만. scroll은 렌더마다 새 객체다
  }, [text, state]);

  if (state === 'review')
    return (
      <ReviewBubble ref={ref} text={text} onEdit={onEdit} hintable={!typed} />
    );

  if (state === 'failed') return <FailedBubble ref={ref} text={text} />;

  // 아직 아무 말도 확정 전이면 듣는 중 표시로, 그 뒤엔 확정 전 말이 남아 있을 때만 점을 띄운다
  const showDots = state === 'speaking' && (text === '' || speechPending);
  return (
    <div
      ref={ref}
      className={`self-end ${MY_BUBBLE_SHAPE} ${state === 'sent' ? 'bg-bubble-mine' : LIVE_OUTLINE}`}
    >
      <p className={`${BUBBLE_TEXT} text-foreground`}>
        {text}
        {showDots && <ListeningDots spaced={text !== ''} />}
      </p>
    </div>
  );
};

/** 말한 뒤 확인 — 말풍선 전체가 고치기 버튼이다. 처음 한 번은 「수정」 옆에 무엇을 할 수 있는지 알린다 */
const ReviewBubble = ({
  text,
  onEdit,
  hintable,
  ref,
}: {
  text: string;
  onEdit: () => void;
  hintable: boolean;
  ref: React.Ref<HTMLDivElement>;
}) => {
  const t = useTranslations('conversation.myBubble');
  const hintVisible = useEditHint(hintable);
  const hintId = useId();
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      // 버튼 안 글은 이름에 묻힌다 — 확인할 문장을 이름에 함께 실어 스크린 리더도 듣게 한다
      aria-label={t('editLabel', { text })}
      aria-describedby={hintVisible ? hintId : undefined}
      onClick={onEdit}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onEdit();
      }}
      // 듣기가 끝나고 이제 내 차례라는 신호로 한 번 살짝 내려앉는다
      className={`animate-review-in flex cursor-pointer flex-col gap-2.5 self-end pr-2 pb-2 text-left ${MY_BUBBLE_SHAPE} ${LIVE_OUTLINE}`}
    >
      <p className={`${BUBBLE_TEXT} pr-1.5 text-foreground`}>{text}</p>
      <div
        className={`flex items-center gap-2 ${hintVisible ? 'justify-between' : 'justify-end'}`}
      >
        {hintVisible && (
          <p id={hintId} className="text-12 text-muted-foreground">
            {t('editHint')}
          </p>
        )}
        {/* 말풍선 전체가 버튼이라 이건 표시일 뿐이다 — 눌러서 고친다는 걸 버튼 모양으로 알린다 */}
        <span
          aria-hidden
          className="flex flex-none items-center gap-1 rounded-full bg-muted py-[5px] pr-[11px] pl-[9px] text-12 font-bold text-foreground"
        >
          <PencilIcon size={13} strokeWidth={2.5} />
          {t('editBadge')}
        </span>
      </div>
    </div>
  );
};

/** 보내지 못함 — 왼쪽 빨간 ! 와 흐려진 글로 무엇이 다시 보내지는지 보여 준다. 다시 보내기는 마이크 자리가 맡는다 */
const FailedBubble = ({
  text,
  ref,
}: {
  text: string;
  ref: React.Ref<HTMLDivElement>;
}) => {
  const t = useTranslations('conversation.myBubble');
  return (
    <div ref={ref} className="flex items-center gap-2 self-end">
      <span
        role="img"
        aria-label={t('unsentLabel')}
        className="flex size-[22px] flex-none items-center justify-center rounded-full bg-destructive text-13 font-bold text-white"
      >
        !
      </span>
      <div className={`bg-bubble-mine ${MY_BUBBLE_SHAPE}`}>
        <p className={`${BUBBLE_TEXT} text-foreground/45`}>{text}</p>
      </div>
    </div>
  );
};
