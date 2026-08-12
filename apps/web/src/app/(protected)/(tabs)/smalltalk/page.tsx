'use client';

// 스몰톡 탭 — 대화 상대를 고르고, 내가 먼저 걸거나 상대가 주제로 먼저 걸게 한다. 정답도 점수도 없는 대화다
import { useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { PartnerCharacter } from '@/features/conversation/ui/character/PartnerCharacter';
import type { FreeTalkTopic } from '@/features/small-talk/api/free-talk';
import { toSpeakingTimeLabel } from '@/features/small-talk/lib/speaking-time';
import { useFreeTalkMainQuery } from '@/features/small-talk/model/useFreeTalkMainQuery';
import { track } from '@/shared/analytics';
import { smallTalkPath } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { ArrowRightIcon } from '@/shared/ui/Icons';

import {
  hasSeenIntroGuide,
  markIntroGuideSeen,
} from './_model/intro-guide-seen';
import { usePartnerGreeting } from './_model/usePartnerGreeting';
import { IntroGuide } from './_ui/IntroGuide';
import { PartnerIntroCard } from './_ui/PartnerIntroCard';
import { PartnerPicker } from './_ui/PartnerPicker';
import { TopicPickerModal } from './_ui/TopicPickerModal';

export default function SmallTalkPage() {
  const router = useRouter();
  const { main, error, isLoading, retry } = useFreeTalkMainQuery();
  // 오늘 예산을 다 썼는지는 서버(canStart)가 판정한다 — 남은 시간으로 프론트가 유추하지 않는다
  const exhausted = main !== null && !main.canStart;
  const [topicOpen, setTopicOpen] = useState(false);
  // 처음 들어온 사람에겐 안내부터 — 닫아야 인사가 시작된다. 서버 렌더엔 localStorage가 없어 안 본 것으로 두고,
  // 하이드레이션 뒤 첫 상태 계산에서 본 기록이 반영된다
  const [guideOpen, setGuideOpen] = useState(() => !hasSeenIntroGuide());
  const { partner, look, speech, greet, selectPartner } = usePartnerGreeting({
    greetsOnMount: !guideOpen,
  });

  const closeGuide = () => {
    markIntroGuideSeen();
    setGuideOpen(false);
    greet();
  };

  // 계측은 세션이 실제로 열리는 대화 화면에서 한다 — 여기서 쏘면 들어가다 만 것도 시작으로 잡힌다
  const startWithMe = () =>
    router.push(smallTalkPath({ partner: partner.id, mode: 'user_first' }));

  const startWithTopic = (topic: FreeTalkTopic) => {
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
      <PartnerPicker selected={partner.id} onSelect={selectPartner} />

      {/* 이 화면은 스크롤이 없다 — 남는 자리는 캐릭터가 먹되 아래위로 한계를 둔다.
          낮은 화면에서 먼저 양보하는 쪽은 캐릭터가 아니라 소개 카드다(글자·여백을 줄인다) */}
      <div className="flex max-h-[190px] min-h-[142px] flex-1 justify-center">
        <PartnerCharacter
          partner={partner.id}
          look={look}
          speech={speech}
          viewBox={partner.portraitViewBox}
        />
      </div>

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

          {/* 하고 싶은 말이 있으면 바로, 아니면 상대가 주제로 열어 준다 — 주 행동이 위다 */}
          <div className="mt-4 flex flex-col gap-3 px-5">
            <Button size="md" disabled={isLoading} onClick={startWithMe}>
              내가 먼저 말 걸기
              <ArrowRightIcon size={16} />
            </Button>
            {/* 배경이 muted라 secondary(같은 회색)는 묻힌다 — 흰 바탕에 테두리를 둔 ghost가 떠 보인다 */}
            <Button
              variant="ghost"
              size="md"
              disabled={isLoading}
              onClick={() => setTopicOpen(true)}
            >
              {partner.koreanName}가 먼저 말 걸기
              <ArrowRightIcon size={16} />
            </Button>
          </div>
        </>
      )}

      {guideOpen && <IntroGuide onClose={closeGuide} />}

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
