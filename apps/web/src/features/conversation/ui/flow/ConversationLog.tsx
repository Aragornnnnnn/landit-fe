// 대화 칸 — 캐릭터 턱 아래부터 마이크 위까지, 지난 대화와 지금 차례의 말을 아래에서부터 쌓는다.
// 칸에 다 안 들어가는 옛 말풍선은 숨기지 않고 위로 스크롤되며, 칸 위 끝에서 흐려져 캐릭터 위로 사라진다.
// 최신 대화를 보는 동안엔 새 말이 오면 따라 내려가고, 끌어 내려 지난 대화를 보는 중엔 움직이지 않고 「↓ 최신 대화로」를 띄운다
'use client';

import {
  createContext,
  Fragment,
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { ArrowDownIcon } from '@/shared/ui/Icons';

import {
  isFollowingLatest,
  scrollTopForLatest,
  scrollTopToFollow,
} from '../../model/chat-scroll';
import type { LogEntry, PartnerLogEntry } from '../../model/conversation-log';
import { PastBubble } from './ChatBubbles';

// 칸 위 끝 흐림 폭 — 옛 말풍선이 직각으로 잘리지 않고 캐릭터 위로 서서히 사라진다
const FADE_PX = 36;
// 화면이 굴린 스크롤을 기다려 주는 시간 — 부드러운 스크롤이 끝날 만큼. 도중에 내용 높이가 바뀌어 목표에 못 닿아도 이 뒤엔 다시 판정한다
const AUTO_SCROLL_SETTLE_MS = 600;
const FADE_MASK = `linear-gradient(to bottom, transparent, #000 ${FADE_PX}px)`;

/** 지금 차례의 말풍선이 칸에 부탁하는 스크롤 — 말하는 줄을 보이게(follow), 다 말하면 첫 줄로(settle) */
export interface ChatScroll {
  follow: (target: HTMLElement) => void;
  settle: () => void;
}

const ChatScrollContext = createContext<ChatScroll | null>(null);

/** 대화 칸 안의 말풍선이 칸 스크롤을 부탁하는 창구 — 칸 밖에서 그리면 null이라 부탁할 곳이 없다 */
export const useChatScroll = () => use(ChatScrollContext);

interface ConversationLogProps {
  entries: readonly LogEntry[];
  // 지금 차례의 말이 바뀌면 달라지는 값 — 바뀐 순간 새 말풍선 자리로 맞추거나, 지난 대화를 보는 중이면 새 답변 점을 켠다
  latestKey: string | number;
  // 지금 차례만 보일 때(키보드로 쓰는 중) — 좁아진 칸에서 답할 질문이 바로 보이게 지난 대화를 숨긴다.
  // 빼지 않고 숨겨 두어 말풍선 상태(해석 펼침 등)가 그대로 남는다
  latestOnly?: boolean;
  // 지금 차례의 말을 칸 가운데에 둔다 — 내가 먼저 거는 대화의 첫 상황 카드처럼 칸에 그것 하나뿐일 때
  latestCentered?: boolean;
  // 지난 상대 말을 그리는 법 — 주면 지금 차례 말풍선처럼 다시 듣기·해석·속마음을 단다. 없으면 대사만 둔다
  renderPartner?: (entry: PartnerLogEntry) => React.ReactNode;
  // 지금 차례의 말(상대 말풍선·생각 중 점 등) — useChatScroll로 칸에 스크롤을 부탁한다
  children: React.ReactNode;
}

export const ConversationLog = ({
  entries,
  latestKey,
  latestOnly = false,
  latestCentered = false,
  renderPartner,
  children,
}: ConversationLogProps) => {
  const t = useTranslations('conversation.conversationLog');
  const boxRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLDivElement>(null);
  // 최신 대화를 따라가는 중인가 — 스크롤마다 갱신해 렌더 없이 읽는다
  const followingRef = useRef(true);
  // 화면이 스스로 굴리는 중인 목표 위치와 기다릴 기한 — 그 사이 스크롤 사건은 사용자가 끈 게 아니니 따라가기 판정에서 뺀다
  const autoScrollRef = useRef<{ top: number; until: number } | null>(null);
  // 지난 대화를 보는 중 — 알약을 띄운다
  const [browsing, setBrowsing] = useState(false);
  // 지난 대화를 보는 사이에 새 답변이 왔다 — 알약에 점을 찍는다
  const [unseen, setUnseen] = useState(false);

  const latestTop = () => latestRef.current?.offsetTop ?? 0;

  // 화면이 굴리는 중인 목표 — 기한이 지났으면 없는 것으로 본다
  const pendingAutoTop = () => {
    const auto = autoScrollRef.current;
    if (!auto || performance.now() > auto.until) return null;
    return auto.top;
  };

  const scrollToAuto = (top: number, behavior: ScrollBehavior) => {
    const box = boxRef.current;
    if (!box || Math.abs(box.scrollTop - top) < 1) return;
    // 같은 자리로 이미 굴러가는 중이면 다시 걸지 않는다 — 부드러운 스크롤이 순간 이동으로 덮이지 않게
    if (pendingAutoTop() === top) return;
    autoScrollRef.current = {
      top,
      until: performance.now() + AUTO_SCROLL_SETTLE_MS,
    };
    box.scrollTo({ top, behavior });
  };

  // 새 말풍선 자리 — 칸에 들어가면 맨 아래, 길면 첫 줄이 칸 위 끝에 오게
  const alignToLatest = (behavior: ScrollBehavior) => {
    const box = boxRef.current;
    if (!box) return;
    scrollToAuto(
      scrollTopForLatest({
        clientHeight: box.clientHeight,
        scrollHeight: box.scrollHeight,
        latestTop: latestTop(),
        fadePx: FADE_PX,
      }),
      behavior,
    );
  };

  const syncFollowing = () => {
    const box = boxRef.current;
    if (!box) return;
    const target = pendingAutoTop();
    // 굴러가는 중이면 판정을 미룬다 — 목표에 닿은 뒤(또는 기한이 지난 뒤)부터 다시 사용자 스크롤로 본다
    if (target != null && Math.abs(box.scrollTop - target) > 1) return;
    autoScrollRef.current = null;
    const following = isFollowingLatest({
      scrollTop: box.scrollTop,
      clientHeight: box.clientHeight,
      scrollHeight: box.scrollHeight,
      latestTop: latestTop(),
      latestBottom: latestTop() + (latestRef.current?.offsetHeight ?? 0),
      fadePx: FADE_PX,
    });
    followingRef.current = following;
    setBrowsing(!following);
    if (following) setUnseen(false);
  };

  // 사용자가 칸을 잡으면 화면이 굴리던 스크롤은 거기서 사용자 것이 된다
  const yieldToUser = () => {
    autoScrollRef.current = null;
  };

  // 새 차례의 말이 온 순간 — 따라가는 중이면 그 자리로, 지난 대화를 보는 중이면 점만 켠다
  useLayoutEffect(() => {
    if (followingRef.current) alignToLatest('smooth');
    else setUnseen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 새 차례가 올 때만 맞춘다
  }, [latestKey]);

  // 칸이나 내용 높이가 바뀌면(말풍선 추가·해석 펼침·입력칸 높이 변화) 따라가는 중일 때만 새 말풍선 자리를 다시 맞춘다.
  // 칸보다 긴 말풍선은 손대지 않는다 — 말하는 줄 따라가기(follow)가 그 자리를 쥐고 있다
  useEffect(() => {
    const box = boxRef.current;
    const content = contentRef.current;
    if (!box || !content) return;
    const observer = new ResizeObserver(() => {
      if (!followingRef.current) return;
      const latestHeight = latestRef.current?.offsetHeight ?? 0;
      if (latestHeight <= box.clientHeight - FADE_PX) alignToLatest('instant');
    });
    observer.observe(box);
    observer.observe(content);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 한 번만 붙인다. 안에서 읽는 값은 전부 ref다
  }, []);

  const scroll: ChatScroll = {
    follow: (target) => {
      const box = boxRef.current;
      if (!box || !followingRef.current) return;
      // 화면 좌표를 스크롤 내용 기준으로 바꾼다
      const origin = box.getBoundingClientRect().top - box.scrollTop;
      const rect = target.getBoundingClientRect();
      scrollToAuto(
        scrollTopToFollow({
          scrollTop: box.scrollTop,
          clientHeight: box.clientHeight,
          targetTop: rect.top - origin,
          targetBottom: rect.bottom - origin,
          fadePx: FADE_PX,
        }),
        'instant',
      );
    },
    settle: () => {
      if (followingRef.current) alignToLatest('smooth');
    },
  };

  const jumpToLatest = () => {
    setUnseen(false);
    followingRef.current = true;
    setBrowsing(false);
    alignToLatest('smooth');
  };

  return (
    // 칸이 아무리 눌려도 상대 말 한 줄과 버튼 줄은 보이게 남긴다(말풍선 여백·버튼 4.75rem + 16px 글 한 줄) — 모자라면 무대가 먼저 줄어든다
    <div className="relative flex min-h-[calc(4.75rem+1.35rem*var(--font-scale))] flex-1 flex-col">
      <div
        ref={boxRef}
        onScroll={syncFollowing}
        // 굴리던 스크롤이 목표에 못 닿고 멈춰도(도중에 내용 높이가 바뀜) 멈춘 자리에서 다시 판정한다
        onScrollEnd={() => {
          yieldToUser();
          syncFollowing();
        }}
        onTouchStart={yieldToUser}
        onWheel={yieldToUser}
        style={{ maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {/* 말풍선이 적으면 아래에 붙는다 — 대화는 마이크 쪽에서부터 쌓인다. 맨 위 여백은 흐림 폭만큼 둬 첫 말이 흐림에 묻히지 않게 한다 */}
        <div
          ref={contentRef}
          className="flex min-h-full flex-col justify-end gap-2.5 px-4 pb-3"
          style={{ paddingTop: FADE_PX }}
        >
          <div
            hidden={latestOnly}
            className={latestOnly ? undefined : 'contents'}
          >
            {entries.map((entry) =>
              entry.speaker === 'PARTNER' && renderPartner ? (
                <Fragment key={entry.id}>{renderPartner(entry)}</Fragment>
              ) : (
                <PastBubble
                  key={entry.id}
                  speaker={entry.speaker}
                  text={entry.text}
                />
              ),
            )}
          </div>
          {/* 지금 차례의 말(상대 말풍선·상황 카드·예시·내 말풍선·점)도 지난 대화와 같은 간격으로 쌓는다 */}
          <div
            ref={latestRef}
            className={`flex flex-col gap-2.5 ${latestCentered ? 'flex-1 justify-center' : ''}`}
          >
            <ChatScrollContext value={scroll}>{children}</ChatScrollContext>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {browsing && (
          <motion.button
            type="button"
            onClick={jumpToLatest}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-card px-3 py-1.5 text-13 font-bold text-foreground shadow-[0_4px_14px_rgba(0,0,0,0.12)] active:opacity-70"
          >
            <ArrowDownIcon size={14} />
            {t('jumpToLatestButton')}
            {unseen && (
              <span
                aria-label={t('newReplyLabel')}
                className="ml-0.5 size-1.5 rounded-full bg-primary"
              />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
