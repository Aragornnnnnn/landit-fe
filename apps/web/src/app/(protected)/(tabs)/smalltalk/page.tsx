'use client';

// 스몰톡 탭 — 대화 상대를 고르고, 내가 먼저 걸거나 상대가 주제로 먼저 걸게 한다. 정답도 점수도 없는 대화다
import { useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { useForceUpdateFirst } from '@/features/app-update/model/useForceUpdateFirst';
import { PartnerCharacter } from '@/features/conversation/ui/character/PartnerCharacter';
import { SatisfactionGate } from '@/features/satisfaction/ui/SatisfactionGate';
import type { SmallTalkTopic } from '@/features/small-talk/api/small-talk';
import { toSpeakingTimeLabel } from '@/features/small-talk/lib/speaking-time';
import { useSmallTalkMainQuery } from '@/features/small-talk/model/useSmallTalkMainQuery';
import { useSpeakingLimit } from '@/features/small-talk/model/useSpeakingLimit';
import { usePromoSheetOpen } from '@/features/subscription/model/exit-promo/promo-handoff';
import { usePaywallGate } from '@/features/subscription/model/paywall-gate/usePaywallGate';
import { track } from '@/shared/analytics';
import { lineBreak } from '@/shared/i18n/rich';
import {
  SMALLTALK_HISTORY_PATH,
  SMALLTALK_PATH,
  smallTalkPath,
} from '@/shared/lib/routes';
import { useSeenFlag } from '@/shared/lib/useSeenFlag';
import { Button } from '@/shared/ui/Button';
import { ArrowRightIcon, ChevronRightIcon } from '@/shared/ui/Icons';
import { RetryNotice } from '@/shared/ui/RetryNotice';

import { tapGreetingSeen } from '../_model/tap-greeting-seen';
import { useEarnShowerHold } from '../_model/useEarnShowerHold';
import { useSatisfactionSheet } from '../_model/useSatisfactionSheet';
import {
  introSentencesOf,
  introSpotlightsOf,
  type IntroSpotlight,
} from './_model/intro-sentences';
import { useIntroGuide } from './_model/useIntroGuide';
import { usePartnerGreeting } from './_model/usePartnerGreeting';
import { useTopicPicker } from './_model/useTopicPicker';
import { GuideSpotlight } from './_ui/GuideSpotlight';
import { IntroGuide } from './_ui/IntroGuide';
import { PartnerIntroCard } from './_ui/PartnerIntroCard';
import { PartnerPicker } from './_ui/PartnerPicker';
import { TopicPickerModal } from './_ui/TopicPickerModal';

// 말풍선 문구 속 <em>을 주황 글자로 — 표현 프리뷰 말풍선과 같다
const emphasis = (chunks: React.ReactNode) => (
  <span className="text-primary">{chunks}</span>
);

export default function SmallTalkPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('smallTalk');
  const { main, fatalError, isLoading, refresh } = useSmallTalkMainQuery();
  // 오늘 예산을 다 썼는지는 서버(canStart)가 판정한다 — 남은 시간으로 프론트가 유추하지 않는다
  const exhausted = main !== null && !main.canStart;
  // 무료 사용자도 5분까지는 바로 시작한다 — 다 쓰면 마무리 인사 아래에서 페이월로 보낸다
  const gate = usePaywallGate();
  // 결제가 열리면 하루 한도가 없다 — 알약에 잔량 대신 무제한을 쓴다
  const { unlimited } = useSpeakingLimit();
  const { partner, look, speech, greet, selectPartner } = usePartnerGreeting();
  const partnerName = t(partner.nameKey);
  // 주제는 서버가 매번 무작위로 뽑아 준다 — 열 때마다, 새로고침할 때마다 다시 받는다
  const picker = useTopicPicker({ partner: partner.id, refresh });
  // 강제 업데이트가 1순위다 — 그거거나 그럴지 모르는 동안엔 안내·시트가 나서지 않는다
  const updateFirst = useForceUpdateFirst();
  // 처음 들어온 사람에겐 래디 안내를 한 번 — 무료 한도를 말해야 해서 잔량을 받은 뒤에 띄우고, 주제를 고르는 동안엔 비킨다
  // 구독 판정 중에도 미룬다 — 무료 한도를 비출지가 그 답에 달렸다
  const { guideOpen, closeGuide, tapPartner } = useIntroGuide({
    onTap: greet,
    held: updateFirst || main === null || gate.deciding || picker.isOpen,
  });
  // 아직 캐릭터를 눌러 본 적 없는 기기엔 머리 옆에 한마디 — 막지 않고, 한 번 누르면 사라진다 (탭 셸의 칩 점과 같은 기록)
  const greetingSeen = useSeenFlag(tapGreetingSeen);
  const greetingHint = !guideOpen && !greetingSeen;
  // 안내가 래디의 말 뒤에 차례로 비추는 자리 — 안내가 뜨는 순간 정해 두고 바꾸지 않는다.
  // 도중에 구독이 와서 자리가 줄면 비추던 자리가 사라져 안내가 어둠만 남긴 채 멈춘다
  const [guideSpotlights, setGuideSpotlights] = useState<
    IntroSpotlight[] | null
  >(null);
  if (guideOpen && guideSpotlights === null)
    setGuideSpotlights(introSpotlightsOf({ free: !unlimited, exhausted }));
  const [guideStep, setGuideStep] = useState<number | null>(null);
  const spotlight: IntroSpotlight | null =
    guideOpen && guideStep !== null && guideSpotlights !== null
      ? (guideSpotlights[guideStep] ?? null)
      : null;
  const nextGuideStep = () =>
    setGuideStep((step) => (step === null ? 0 : step + 1));
  const guideSentences = introSentencesOf({
    freeTalkBody: t.raw('introGuide.freeTalkBody'),
    endingBody: t.raw('introGuide.endingBody'),
  });
  // 이번 방문에 띄울 시트 하나 — 첫 스몰톡 소감 → 리뷰 요청
  const satisfactionSheet = useSatisfactionSheet('smalltalk');
  // 할인 시트가 떠 있으면 소감은 미룬다 — 할인은 5분뿐이고 소감은 다음에 또 물을 수 있다
  const promoOpen = usePromoSheetOpen();
  // 돌아온 순간의 환급 동전 연출이 끝날 때까지도 미룬다 — 어둠 아래에서 시트가 같이 올라오면 둘이 겹친다
  const showerHold = useEarnShowerHold();
  const sheetsHeld = updateFirst || promoOpen || showerHold;

  // 캐릭터 탭 인사 — 머리 옆 힌트 말풍선이 떠 있을 때 눌렀는지도 남긴다 (힌트가 시킨 탭인지)
  const tapGreeting = () => {
    track(EVENTS.SMALL_TALK_GREETING_TAPPED, {
      partner: partner.id,
      coached: greetingHint,
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
    picker.closePicker();
    router.push(
      smallTalkPath({
        partner: partner.id,
        mode: 'ai_first',
        topicId: topic.topicId,
      }),
    );
  };

  const openPaywall = () =>
    gate.guard(() => {}, { source: 'smalltalk', returnTo: SMALLTALK_PATH });

  if (fatalError) {
    return (
      <RetryNotice
        fill
        screen="smalltalk"
        message={fatalError.message}
        onRetry={() => void refresh()}
      />
    );
  }

  return (
    // 이 화면은 스크롤이 없다 — 폰 높이가 아니라 이 영역이 실제로 받은 높이(내비 바·헤더를 뺀 값)를 기준으로
    // 두 단계(cq-short·cq-tiny) 줄인다. 캐릭터는 그러고 남은 자리를 먹는다
    <div className="[container-type:size] flex flex-1 flex-col overflow-hidden pb-[max(var(--safe-area-inset-bottom),16px)]">
      {/* 기록은 오늘 대화를 시작하는 길과 섞이면 안 된다 — 화면 안쪽 오른쪽 위에 잔글씨로 둔다.
          상대 줄과 수직 중앙을 맞추면 네 번째 상대처럼 읽혀서, 그 줄보다 위에 걸쳐 둔다 */}
      <div className="relative">
        <button
          onClick={() => router.push(SMALLTALK_HISTORY_PATH)}
          className="absolute top-1 right-5 flex items-center gap-0.5 py-1 text-13 font-semibold text-muted-foreground active:opacity-60"
        >
          {t('tabPage.historyButton')}
          <ChevronRightIcon size={14} />
        </button>
        <PartnerPicker selected={partner.id} onSelect={selectPartner} />
      </div>

      {/* 남는 자리는 캐릭터가 먹는다 — 위로는 한계를 두고, 아래로는 작은 폰에서 버튼이 밀려나지 않게 끝까지 줄어든다 */}
      {/* 캐릭터는 눌리는 것이다 — 누르면 자기소개를 한다. 눌린 느낌은 살짝 눌리는 크기로 준다 */}
      <button
        type="button"
        onClick={tapGreeting}
        aria-label={t('tabPage.greetingLabel', { name: partnerName })}
        className="relative flex max-h-[190px] min-h-0 flex-1 justify-center transition-transform active:scale-[0.97]"
      >
        {greetingHint && (
          // 말풍선은 읽어 주지 않는다 — 버튼 이름이 같은 말을 한다. 살짝 떠서 살아 있음만 준다 (rAF가 멎는 웹뷰라 CSS)
          <span
            aria-hidden
            data-testid="greeting-hint"
            className="pointer-events-none absolute top-2 left-[calc(50%+42px)] flex h-9 items-center rounded-2xl rounded-bl-md bg-card px-3.5 text-13 font-semibold whitespace-nowrap text-foreground shadow-md shadow-black/10 motion-safe:animate-[nudge-bob_2.2s_ease-in-out_infinite]"
          >
            {t('greetingHint.bubbleCaption')}
          </span>
        )}
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

      {/* 무료 5분을 다 쓰면 잠긴 버튼 대신 마무리 인사가 그 자리를 대신한다 — 눌리지 않는 버튼을 남겨 두면
          왜 안 되는지부터 묻게 된다. "다 썼다"는 소진이지만 실은 무료 몫을 완주한 것이라 채웠다고 말하고, 이어 갈 길(페이월)을 둔다
          (한도는 서버 값 그대로 적는다 — 칩 말풍선도 같은 값을 쓴다) */}
      {exhausted && main ? (
        <div className="mt-8 flex flex-col items-center gap-1.5 px-5 cq-tiny:mt-4">
          <p className="text-lg font-extrabold break-keep text-foreground cq-tiny:text-base">
            {t('tabPage.doneTitle', {
              limit: toSpeakingTimeLabel(main.dailySpeakingTimeLimitMs, locale),
            })}
          </p>
          <p className="text-sm font-medium break-keep text-muted-foreground">
            {t('tabPage.doneCaption')}
          </p>
          {gate.locked && (
            <Button size="md" className="mt-4 w-full" onClick={openPaywall}>
              {t('tabPage.premiumButton')}
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* 남은 시간은 시작을 누르기 직전에 알아야 하는 값이라, 잔글씨 대신 알약으로 세워 둔다.
              테두리를 두면 입력칸처럼 보여서, 흰 바탕에 옅은 그림자만으로 배경에서 띄운다.
              높이(h-8)는 알약 크기로 미리 잡아 둔다 — 값이 늦게 와서 그때 나타나면 아래 버튼이 밀린다.
              아주 낮은 화면에서는 알약을 빼서 그 자리를 캐릭터에 준다 */}
          {/* 잔량과 시작 버튼은 한 덩이다 — 주제가 없어 아래 버튼이 빠지는 날에도
              둘이 함께 바닥 쪽에 서서 손이 기억하는 자리가 안 바뀐다 */}
          <div className="mt-auto">
            <div className="mt-3 flex h-8 justify-center cq-tiny:hidden">
              {main && (
                <GuideSpotlight
                  active={spotlight === 'limit'}
                  rounded="rounded-full"
                  message={t.rich('introGuide.limitCaption', {
                    ...lineBreak,
                    em: emphasis,
                    limit: toSpeakingTimeLabel(
                      main.dailySpeakingTimeLimitMs,
                      locale,
                    ),
                  })}
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
                    {t('tabPage.remainingLabel')}
                    <span className="text-sm font-bold text-primary">
                      {unlimited
                        ? t('tabPage.unlimitedLabel')
                        : toSpeakingTimeLabel(
                            main.remainingSpeakingTimeMs,
                            locale,
                          )}
                    </span>
                  </span>
                </GuideSpotlight>
              )}
            </div>

            {/* 하고 싶은 말이 있으면 바로, 아니면 상대가 주제로 열어 준다 — 주 행동이 위다.
              주제가 없어 아래 버튼이 빠지는 날에도 시작 버튼이 같은 자리에 서도록 바닥에 붙인다 */}
            <div className="mt-4 flex flex-col gap-3 px-5 cq-tiny:mt-3 cq-tiny:gap-2">
              <Button
                size="md"
                className="cq-tiny:h-11"
                disabled={isLoading}
                onClick={startWithMe}
              >
                {t('tabPage.userFirstButton')}
                <ArrowRightIcon size={16} />
              </Button>
              {/* 고를 주제가 없으면 이 길은 없는 것이다 — 조회 중엔 자리를 지킨다.
                배경이 muted라 secondary(같은 회색)는 묻힌다 — 흰 바탕에 테두리를 둔 ghost가 떠 보인다 */}
              {(!main || main.topics.length > 0) && (
                <Button
                  variant="ghost"
                  size="md"
                  className="cq-tiny:h-11"
                  disabled={isLoading}
                  onClick={() => void picker.openPicker()}
                >
                  {t('tabPage.partnerFirstButton', { name: partnerName })}
                  <ArrowRightIcon size={16} />
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {guideOpen && (
        <IntroGuide
          sentences={guideSentences}
          spotlights={guideSpotlights ?? []}
          spot={guideStep}
          onNext={nextGuideStep}
          onClose={closeGuide}
        />
      )}
      {/* 스몰톡을 마치고 돌아온 사람에게 한 번 — 안내·코치마크는 첫 진입 때 이미 끝난 뒤라 겹치지 않는다 */}
      {!sheetsHeld && satisfactionSheet === 'talk' && (
        <SatisfactionGate moment="smalltalk" />
      )}
      {!sheetsHeld && satisfactionSheet === 'review' && (
        <SatisfactionGate moment="review" />
      )}

      <TopicPickerModal
        open={picker.isOpen}
        partnerName={partnerName}
        topics={main?.topics ?? []}
        refreshing={picker.refreshing}
        onRefresh={() => void picker.refreshTopics()}
        onSelect={startWithTopic}
        onClose={picker.closePicker}
      />
    </div>
  );
}
