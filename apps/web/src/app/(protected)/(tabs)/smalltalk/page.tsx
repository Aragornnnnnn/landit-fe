'use client';

// 스몰톡 탭 — 대화 상대를 고르고, 내가 먼저 걸거나 상대가 주제로 먼저 걸게 한다. 정답도 점수도 없는 대화다
import { useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

import { PartnerCharacter } from '@/features/conversation/ui/character/PartnerCharacter';
import { SatisfactionGate } from '@/features/satisfaction/ui/SatisfactionGate';
import type { SmallTalkTopic } from '@/features/small-talk/api/small-talk';
import { toSpeakingTimeLabel } from '@/features/small-talk/lib/speaking-time';
import { useSmallTalkMainQuery } from '@/features/small-talk/model/useSmallTalkMainQuery';
import { track } from '@/shared/analytics';
import { SMALLTALK_HISTORY_PATH, smallTalkPath } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { ArrowRightIcon, ChevronRightIcon } from '@/shared/ui/Icons';

import { useGreetingCoach } from './_model/useGreetingCoach';
import { usePartnerGreeting } from './_model/usePartnerGreeting';
import { CoachBubble, CoachDim } from './_ui/GreetingCoach';
import { IntroGuide } from './_ui/IntroGuide';
import { PartnerIntroCard } from './_ui/PartnerIntroCard';
import { PartnerPicker } from './_ui/PartnerPicker';
import { TopicPickerModal } from './_ui/TopicPickerModal';

export default function SmallTalkPage() {
  const router = useRouter();
  const { main, error, isLoading, retry } = useSmallTalkMainQuery();
  // 오늘 예산을 다 썼는지는 서버(canStart)가 판정한다 — 남은 시간으로 프론트가 유추하지 않는다
  const exhausted = main !== null && !main.canStart;
  const [topicOpen, setTopicOpen] = useState(false);
  const { partner, look, speech, greet, selectPartner } = usePartnerGreeting();
  // 처음 들어온 사람에겐 래디 안내부터, 닫으면 캐릭터를 눌러 보라는 코치마크 — 둘 다 기기당 한 번이다
  const { guideOpen, coaching, closeGuide, tapPartner, partnerRef, trapFocus } =
    useGreetingCoach({ onTap: greet });

  // 캐릭터 탭 인사 — 코치마크가 켜진 채로 눌렀는지도 함께 남긴다 (코치마크가 시킨 첫 탭인지)
  const tapGreeting = () => {
    track(EVENTS.SMALL_TALK_GREETING_TAPPED, {
      partner: partner.id,
      coached: coaching,
    });
    tapPartner();
  };

  // 대화 시작 계측은 세션이 실제로 열리는 대화 화면에서 한다 — 여기서 쏘면 들어가다 만 것도 시작으로 잡힌다
  const startWithMe = () =>
    router.push(smallTalkPath({ partner: partner.id, mode: 'user_first' }));

  const startWithTopic = (topic: SmallTalkTopic) => {
    track(EVENTS.SMALL_TALK_TOPIC_SELECTED, {
      partner: partner.id,
      topic_id: topic.topicId,
    });
    setTopicOpen(false);
    router.push(
      smallTalkPath({
        partner: partner.id,
        mode: 'ai_first',
        topicId: topic.topicId,
      }),
    );
  };

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted-foreground">{error.message}</p>
        <Button
          variant="secondary"
          size="sm"
          className="w-auto px-6"
          onClick={() => {
            track(EVENTS.ERROR_RETRIED, { screen: 'smalltalk' });
            retry();
          }}
        >
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden pb-4">
      {/* 기록은 오늘 대화를 시작하는 길과 섞이면 안 된다 — 화면 안쪽 오른쪽 위에 잔글씨로 둔다.
          상대 줄과 수직 중앙을 맞추면 네 번째 상대처럼 읽혀서, 그 줄보다 위에 걸쳐 둔다 */}
      <div className="relative">
        <button
          onClick={() => router.push(SMALLTALK_HISTORY_PATH)}
          className="absolute top-1 right-5 flex items-center gap-0.5 py-1 text-[13px] font-semibold text-muted-foreground active:opacity-60"
        >
          기록
          <ChevronRightIcon size={14} />
        </button>
        <PartnerPicker selected={partner.id} onSelect={selectPartner} />
      </div>

      {/* 이 화면은 스크롤이 없다 — 남는 자리는 캐릭터가 먹되 아래위로 한계를 둔다.
          낮은 화면에서 먼저 양보하는 쪽은 캐릭터가 아니라 소개 카드다(글자·여백을 줄인다) */}
      {/* 캐릭터는 눌리는 것이다 — 누르면 자기소개를 한다. 코치마크가 켜진 동안은 딤(z-40) 위 z-50으로 올라와
          화면에서 유일하게 눌리는 것이 되고, 말풍선 한마디가 붙는다. 눌린 느낌은 살짝 눌리는 크기로 준다 */}
      <button
        ref={partnerRef}
        type="button"
        onClick={tapGreeting}
        onKeyDown={trapFocus}
        aria-label={`${partner.koreanName} 인사 듣기`}
        className={[
          'relative flex max-h-[190px] min-h-[142px] flex-1 justify-center transition-transform active:scale-[0.97]',
          coaching && 'z-50',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <AnimatePresence>{coaching && <CoachBubble />}</AnimatePresence>
        <PartnerCharacter
          partner={partner.id}
          look={look}
          speech={speech}
          viewBox={partner.portraitViewBox}
        />
      </button>

      {/* 소개 길이가 상대마다 달라 카드 높이도 다르다(174~198) — 그 차이는 위 캐릭터 칸이 흡수하므로
          여기서 자리를 미리 잡아 둘 필요가 없다. 아래 버튼은 어느 상대에서도 제자리다 */}
      <div className="px-5">
        <PartnerIntroCard partner={partner} />
      </div>

      {/* 다 쓴 날은 잠긴 버튼 대신 마무리 인사가 그 자리를 대신한다 — 눌리지 않는 버튼을 남겨 두면
          왜 안 되는지부터 묻게 된다. "다 썼다"는 소진이지만 실은 오늘 몫을 완주한 것이라 채웠다고 말한다
          (1분은 안내 문구와 같은 하드코딩 — 사람마다 달라지면 둘 다 서버 값으로 바꾼다) */}
      {exhausted ? (
        <div className="mt-8 flex flex-col items-center gap-1.5 px-5">
          <p className="text-lg font-extrabold break-keep text-foreground">
            오늘의 1분 스몰톡을 다 했어요
          </p>
          <p className="text-sm font-medium break-keep text-muted-foreground">
            내일 또 같이 이야기해요
          </p>
        </div>
      ) : (
        <>
          {/* 남은 시간은 시작을 누르기 직전에 알아야 하는 값이라, 잔글씨 대신 알약으로 세워 둔다.
              테두리를 두면 입력칸처럼 보여서, 흰 바탕에 옅은 그림자만으로 배경에서 띄운다.
              높이(h-8)는 알약 크기로 미리 잡아 둔다 — 값이 늦게 와서 그때 나타나면 아래 버튼이 밀린다 */}
          {/* 잔량과 시작 버튼은 한 덩이다 — 주제가 없어 아래 버튼이 빠지는 날에도
              둘이 함께 바닥 쪽에 서서 손이 기억하는 자리가 안 바뀐다 */}
          <div className="mt-auto">
            <div className="mt-3 flex h-8 justify-center">
              {main && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
                  오늘 남은 말하기
                  <span className="text-sm font-bold text-primary">
                    {toSpeakingTimeLabel(main.remainingSpeakingTimeMs)}
                  </span>
                </span>
              )}
            </div>

            {/* 하고 싶은 말이 있으면 바로, 아니면 상대가 주제로 열어 준다 — 주 행동이 위다.
              주제가 없어 아래 버튼이 빠지는 날에도 시작 버튼이 같은 자리에 서도록 바닥에 붙인다 */}
            <div className="mt-4 flex flex-col gap-3 px-5">
              <Button size="md" disabled={isLoading} onClick={startWithMe}>
                내가 먼저 말 걸기
                <ArrowRightIcon size={16} />
              </Button>
              {/* 고를 주제가 없으면 이 길은 없는 것이다 — 조회 중엔 자리를 지킨다.
                배경이 muted라 secondary(같은 회색)는 묻힌다 — 흰 바탕에 테두리를 둔 ghost가 떠 보인다 */}
              {(!main || main.topics.length > 0) && (
                <Button
                  variant="ghost"
                  size="md"
                  disabled={isLoading}
                  onClick={() => setTopicOpen(true)}
                >
                  {partner.koreanName}가 먼저 말 걸기
                  <ArrowRightIcon size={16} />
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {guideOpen && <IntroGuide onClose={closeGuide} />}
      <AnimatePresence>{coaching && <CoachDim />}</AnimatePresence>
      {/* 첫 스몰톡을 마치고 돌아온 사람에게 한 번 — 안내·코치마크는 첫 진입 때 이미 끝난 뒤라 겹치지 않는다 */}
      <SatisfactionGate moment="smalltalk" />

      <TopicPickerModal
        open={topicOpen}
        partnerName={partner.koreanName}
        topics={main?.topics ?? []}
        onSelect={startWithTopic}
        onClose={() => setTopicOpen(false)}
      />
    </div>
  );
}
