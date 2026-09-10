'use client';

// 학습 준비 — 방금 대화에서 뽑은 표현 네 개를 흐리게 깔고, 그 위에서 래디와 대화 상대들이 장면을 바꿔 가며
// "레벨에 맞춰 준비했다 → 프리톡 → 학습하면 이런 게 나온다"를 소개한다. CTA가 페이월(무료) 또는 표현 분기(유료)로 이어진다.
// 내용을 흐리는 건 의도다 — 더 궁금하게 두고 결제창을 만난다 (docs/subscription.md 「무료 구간과 페이월 게이트」)
import { useEffect, useEffectEvent, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';

import type { Partner } from '@/features/conversation/model/character-look';
// 가로 import 사유: 소개하는 얼굴은 대화 상대 셋이고, 그 그림과 상반신 크롭은 conversation·expression이 정본이다
import { PartnerAvatar } from '@/features/conversation/ui/character/PartnerAvatar';
import { QUIZ_VIEWBOX } from '@/features/expression/model/quiz-partner';
import { track } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';
import { DURATION, EASE_STANDARD } from '@/shared/motion';
import { Button } from '@/shared/ui/Button';

interface PreparedLearningScreenProps {
  scenarioId: number;
  onContinue: () => void;
}

interface PreparedLearningViewProps {
  scenarioId: number;
  nickname: string | null;
  onContinue: () => void;
}

// 흐린 자리에 넣는 글 — 실제 표현은 보여주지 않는다. 길이와 리듬만 카드처럼 보이면 된다.
// 개수도 고정이다. 시나리오마다 표현이 네 개이고, 진짜 목록은 결제한 뒤 표현 분기에서 받는다 — 여기서 미리 부르면 숫자가 튄다
const PLACEHOLDER_ROWS = [
  ['커피 한잔 하러 갈래?', 'grab a coffee'],
  ['나도 완전 콜이야', "I'm down for it"],
  ['잠깐 들를게', 'stop by'],
  ['내가 늘 찾는 메뉴야', 'my go-to'],
];
const COUNT = PLACEHOLDER_ROWS.length;

// 말풍선은 한 장면(SLIDE_MS)만 떠 있다 — 한 줄로 끝나는 짧은 문장에, 핵심 단어 하나만 색으로 띄운다
interface Caption {
  text: string;
  highlight: string;
}

// 프리톡 장면의 얼굴은 여기 없다 — 바퀴마다 PARTNER_ROTATION에서 고른다
type Slide =
  | { kind: 'landy'; image: string; caption: Caption }
  | { kind: 'partner'; caption: Caption };

// 장면 순서 — 레벨 맞춤 → 방금 대화에서 뽑은 4개 → 이미지·예문·퀴즈 → 발음 평가 → 복습 퀴즈 → 프리톡(상대).
// 여섯 장, 한 바퀴 10.8초. 문장은 각각 끝나게 쓴다(~요)
const toSlides = (nickname: string | null): Slide[] => [
  {
    kind: 'landy',
    image: '/images/character/landy-point.webp',
    caption: {
      text: nickname
        ? `${nickname}님 레벨에 딱 맞춰 드려요`
        : '내 레벨에 딱 맞춰 드려요',
      highlight: '레벨',
    },
  },
  {
    kind: 'landy',
    // 학습지를 들고 내미는 래디 — 2026-09-08 받은 전용 이미지
    image: '/images/character/landy-worksheet.webp',
    caption: {
      text: `방금 대화에서 바로 뽑은 표현 ${COUNT}개예요`,
      highlight: `표현 ${COUNT}개`,
    },
  },
  {
    kind: 'landy',
    image: '/images/character/landy-review.webp',
    caption: {
      text: '이미지·예문·퀴즈로 익혀요',
      highlight: '이미지·예문·퀴즈',
    },
  },
  {
    kind: 'landy',
    image: '/images/character/landy-loading-01-listening.webp',
    caption: {
      text: '발음 평가로 원어민에 가까워져요',
      highlight: '발음 평가',
    },
  },
  {
    kind: 'landy',
    image: '/images/character/landy-perfect.webp',
    caption: {
      text: '복습 퀴즈로 완전히 체화해요',
      highlight: '복습 퀴즈',
    },
  },
  {
    kind: 'partner',
    caption: { text: '무제한 프리톡에서 활용해요', highlight: '무제한 프리톡' },
  },
];

// 강조 단어를 앞뒤 글과 나눠 색을 입힌다
const renderCaption = ({ text, highlight }: Caption) => {
  const at = text.indexOf(highlight);
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <span className="text-primary">{highlight}</span>
      {text.slice(at + highlight.length)}
    </>
  );
};

// 프리톡 장면의 얼굴은 한 바퀴마다 바꾼다 — 셋 다 있다는 걸 보여주되 장면 수는 늘리지 않는다
const PARTNER_ROTATION: Partner[] = ['chloe', 'marco', 'teddy'];
const SLIDE_MS = 1_800;

export const PreparedLearningView = ({
  scenarioId,
  nickname,
  onContinue,
}: PreparedLearningViewProps) => {
  const reduced = useReducedMotion() ?? false;
  const slides = toSlides(nickname);
  // 몇 번째 장면인지 누적으로 센다 — 바퀴 수로 프리톡 얼굴을 고른다
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(
      () => setTick((current) => current + 1),
      SLIDE_MS,
    );
    return () => clearInterval(timer);
  }, [reduced]);

  // 노출은 한 번만
  const trackViewed = useEffectEvent(() =>
    track(EVENTS.PREPARED_LEARNING_VIEWED, { scenario_id: scenarioId }),
  );
  useEffect(() => {
    trackViewed();
  }, []);

  const proceed = () => {
    track(EVENTS.PREPARED_LEARNING_CONTINUED, { scenario_id: scenarioId });
    onContinue();
  };

  const slide = slides[tick % slides.length];
  const loop = Math.floor(tick / slides.length);
  const partner = PARTNER_ROTATION[loop % PARTNER_ROTATION.length];
  const slideKey = `${tick % slides.length}-${slide.kind === 'partner' ? partner : ''}`;

  return (
    <main
      className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-background px-6"
      style={{ paddingTop: 'calc(max(env(safe-area-inset-top), 18px) + 44px)' }}
    >
      <h1 className="text-[22px] leading-[1.35] font-black break-keep">
        방금 대화를 더 원어민처럼 할 수 있도록
        <br />
        맞춤형 학습{' '}
        <span className="text-[30px] leading-none font-black text-primary">
          {COUNT}개
        </span>
        를 준비했어요
      </h1>

      {/* 흐린 학습지 위에서 장면이 바뀐다 — 말풍선과 얼굴이 함께 넘어가고, 자물쇠 줄은 고정 */}
      {/* 카드 네 장 높이만으로는 캐릭터가 넘칠 수 있어 장면이 설 높이를 확보한다 */}
      <section className="relative mt-4 min-h-[380px]">
        <ul
          className="flex flex-col gap-2.5 blur-[5px] select-none"
          aria-hidden="true"
        >
          {PLACEHOLDER_ROWS.map(([meaning, expression], index) => (
            <li
              key={expression}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[12px] font-bold text-muted-foreground">
                {index + 1}
              </span>
              <span className="flex flex-col">
                <span className="text-[15px] font-bold">{meaning}</span>
                <span className="text-[12px] text-muted-foreground">
                  {expression}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="sr-only">
          {`잠긴 학습 ${COUNT}개. 레벨에 맞춰 준비한 학습을 이미지·예문·퀴즈, 발음 평가, 복습 퀴즈, 프리톡으로 이어 가요`}
        </p>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={slideKey}
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
            >
              {/* 꼬리는 가운데 아래 — 캐릭터가 바로 밑에 서 있으니 모서리를 깎는 대신 작은 삼각형으로 가리킨다 */}
              {/* 장면은 보는 사람을 위한 장식이라 보조기기에 매번 읽히지 않는다 — 요약은 아래 sr-only 한 줄이 맡는다 */}
              <p
                data-testid="slide-caption"
                aria-hidden="true"
                className="relative rounded-2xl bg-foreground px-5 py-3 text-[17px] font-bold whitespace-nowrap text-background shadow-lg after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[6px] after:border-transparent after:border-t-foreground"
              >
                {renderCaption(slide.caption)}
              </p>
              <div className="flex h-[150px] items-end justify-center">
                {slide.kind === 'partner' ? (
                  <PartnerAvatar
                    partner={partner}
                    viewBox={QUIZ_VIEWBOX[partner]}
                    className="h-[150px] w-auto drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)]"
                  />
                ) : (
                  <Image
                    src={slide.image}
                    alt=""
                    width={150}
                    height={150}
                    className="h-[140px] w-auto drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)]"
                  />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <div className="flex-1" />
      <div className="pt-4 pb-[max(env(safe-area-inset-bottom),24px)]">
        <Button onClick={proceed}>학습 시작하기</Button>
      </div>
    </main>
  );
};

// 실제 화면 — 닉네임만 읽는다. 표현 목록은 여기서 부르지 않는다 (결제한 뒤 표현 분기가 받는다)
export const PreparedLearningScreen = ({
  scenarioId,
  onContinue,
}: PreparedLearningScreenProps) => {
  const nickname = useAuthStore((state) => state.member?.nickname ?? null);

  return (
    <PreparedLearningView
      scenarioId={scenarioId}
      nickname={nickname}
      onContinue={onContinue}
    />
  );
};
