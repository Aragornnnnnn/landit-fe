'use client';

// 롤플레이 데모 세 장 — 빈 홈의 상황 카드가 어두운 무대에 펼쳐지고(더미), 아이디어가 세 칸을 번갈아 채우고(만들기), 그 상황 그림 아래서 대화가 이어진다(대화).
// 실제 화면의 조각 대신 무대를 어둡게 깔아 앞선 혜택들과 다른 재미를 보여 준다
import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';

import type { Partner } from '@/features/conversation/model/character-look';
import { PartnerAvatar } from '@/features/conversation/ui/character/PartnerAvatar';
import { findPartner } from '@/features/small-talk/model/partner';
import { lineBreak } from '@/shared/i18n/rich';
import { useInView } from '@/shared/lib/useInView';
import { useLoopClock } from '@/shared/lib/useLoopClock';
import { GradientSparkle } from '@/shared/ui/GradientSparkle';

import { DemoScreen } from './DemoScreen';

const DECK_CARDS = [
  {
    labelKey: 'presidentIdeaLabel',
    src: '/images/roleplay/idea-president.webp',
    className: 'left-[2px] top-[72px] w-[158px]',
    labelClassName: 'left-3 w-[96px] text-left',
    rotate: '-9deg',
    fromX: '100px',
    delay: '0.12s',
  },
  {
    labelKey: 'alienIdeaLabel',
    src: '/images/roleplay/idea-alien.webp',
    className: 'right-[2px] top-[56px] w-[158px]',
    labelClassName: 'right-3 w-[96px] text-right',
    rotate: '9deg',
    fromX: '-100px',
    delay: '0.12s',
  },
  {
    labelKey: 'zombieIdeaLabel',
    src: '/images/roleplay/idea-zombie.webp',
    className: 'left-[110px] top-[12px] z-10 w-[170px]',
    labelClassName: 'inset-x-3 text-left',
    rotate: '0deg',
    fromX: '0px',
    delay: '0s',
  },
] as const;

/** 상황 카드 더미 — 옆 카드는 가운데에 가리지 않는 쪽으로 글을 붙인다. 카드가 화면에 들어올 때 한 뭉치에서 펼쳐진다. 일찍 돌아 버리면 아무도 못 본다 */
export const RoleplayDeckDemo = ({ width }: { width: number }) => {
  const t = useTranslations('paywall.roleplayDemo');
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <DemoScreen width={width}>
      <div
        ref={ref}
        className="absolute inset-0 bg-[#14132b] pt-9 text-center text-white"
      >
        <div className="absolute inset-x-0 top-20 h-[420px] bg-[radial-gradient(ellipse_34%_40%_at_20%_56%,rgba(99,140,255,0.55),transparent),radial-gradient(ellipse_38%_44%_at_50%_44%,rgba(251,146,90,0.5),transparent),radial-gradient(ellipse_34%_40%_at_80%_54%,rgba(160,120,255,0.6),transparent)]" />
        <p className="relative text-26 leading-snug font-bold break-keep">
          {t.rich('deckTitle', lineBreak)}
        </p>
        <div className="relative mt-3 h-[340px]">
          {DECK_CARDS.map((card, index) => (
            <div
              key={card.labelKey}
              className={`absolute ${card.className} ${inView ? 'animate-idea-deal' : ''}`}
              style={
                {
                  transform: `rotate(${card.rotate})`,
                  '--deal-x': card.fromX,
                  '--deal-rotate': card.rotate,
                  '--deal-delay': card.delay,
                } as CSSProperties
              }
            >
              <div
                className={`relative aspect-[2/3] overflow-hidden rounded-[22px] bg-[#14132b] shadow-[0_14px_30px_rgba(0,0,0,0.45)] ${inView ? 'animate-idea-float' : ''}`}
                style={
                  {
                    '--float-duration': `${3.6 + index * 0.5}s`,
                  } as CSSProperties
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- 작은 장식 그림이라 이미지 최적화가 할 일이 없다 */}
                <img
                  src={card.src}
                  alt=""
                  className="size-full object-cover"
                  draggable={false}
                />
                <div className="absolute inset-x-0 bottom-0 h-[58%] bg-linear-to-b from-black/0 to-black/80" />
                <p
                  className={`absolute bottom-3 text-15 leading-[1.3] font-bold break-keep ${card.labelClassName}`}
                >
                  {t.rich(card.labelKey, lineBreak)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="relative mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-15 font-bold">
          <GradientSparkle size={18} />
          {t('deckCaption')}
        </p>
      </div>
    </DemoScreen>
  );
};

/** 아이디어 한 조합 — 상대와 세 칸의 문구. 빈 홈 카드의 상대와 같다 */
const IDEAS = [
  {
    partner: 'marco',
    nameKey: 'marcoLabel',
    myRoleKey: 'zombieMyRoleCaption',
    partnerRoleKey: 'zombiePartnerRoleCaption',
    situationKey: 'zombieSituationCaption',
  },
  {
    partner: 'chloe',
    nameKey: 'chloeLabel',
    myRoleKey: 'alienMyRoleCaption',
    partnerRoleKey: 'alienPartnerRoleCaption',
    situationKey: 'alienSituationCaption',
  },
  {
    partner: 'teddy',
    nameKey: 'teddyLabel',
    myRoleKey: 'presidentMyRoleCaption',
    partnerRoleKey: 'presidentPartnerRoleCaption',
    situationKey: 'presidentSituationCaption',
  },
] as const satisfies readonly { partner: Partner; [key: string]: string }[];

const IDEA_DURATIONS = [2800, 2800, 2800] as const;

/** 만들기 — 화면에 있는 동안 「아이디어 추천받기」가 세 칸을 다음 상황으로 번갈아 채운다. 칸마다 빛이 지나가는 건 실제 화면과 같다 */
export const RoleplayFormDemo = ({ width }: { width: number }) => {
  const t = useTranslations('paywall.roleplayDemo');
  const tName = useTranslations('paywall.smallTalkDemo');
  const { ref, inView } = useInView<HTMLDivElement>(undefined, { once: false });
  const { step } = useLoopClock(IDEA_DURATIONS, inView);
  const idea = IDEAS[step];
  const name = tName(idea.nameKey);
  const fields = [
    { label: t('myRoleLabel'), value: t(idea.myRoleKey) },
    { label: t('partnerRoleLabel', { name }), value: t(idea.partnerRoleKey) },
    { label: t('situationLabel'), value: t(idea.situationKey), tall: true },
  ];

  return (
    <DemoScreen width={width}>
      <div ref={ref} className="absolute inset-0 bg-background">
        <div className="flex flex-col items-center gap-1.5 pt-5">
          <span className="size-18 overflow-hidden rounded-full bg-[#fdf1e8]">
            <PartnerAvatar
              key={idea.partner}
              partner={idea.partner}
              viewBox={findPartner(idea.partner).avatarViewBox}
              className="animate-soft-in size-full"
            />
          </span>
          <span className="text-lg font-bold text-foreground">{name}</span>
        </div>
        <div className="flex flex-col gap-3.5 px-6 pt-3">
          {fields.map(({ label, value, tall }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <p className="text-15 font-medium text-foreground">{label}</p>
              <div
                className={`relative overflow-hidden rounded-2xl border border-primary/50 bg-card p-4 ${tall ? 'h-[84px]' : 'h-[58px]'}`}
              >
                <p
                  key={step}
                  className="animate-soft-in text-17 leading-[26px] break-keep text-foreground"
                >
                  {value}
                </p>
                <span
                  key={`sweep-${step}`}
                  className="animate-field-sweep absolute inset-y-0 -left-1/2 w-1/2 bg-linear-to-r from-primary/0 via-primary/25 to-primary/0"
                />
              </div>
            </div>
          ))}
          <p className="mt-0.5 flex h-13 items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-17 font-bold text-foreground shadow-[0_4px_0_var(--border)]">
            <GradientSparkle size={18} />
            {t('ideaButton')}
          </p>
        </div>
      </div>
    </DemoScreen>
  );
};

/** 상황별 대화 한 토막 — 대화는 영어라 문구를 옮기지 않는다. 좀비 그림 속 브로콜리를 대화가 이어받는다 */
const TALKS = {
  zombie: {
    src: '/images/roleplay/idea-zombie.webp',
    roleKey: 'zombiePartnerRoleCaption',
    lines: [
      { mine: false, text: "Braaains... I'm so hungry." },
      { mine: true, text: 'How about broccoli instead?' },
      { mine: false, text: 'Broc-co-li? Tell me more...' },
    ],
  },
  alien: {
    src: '/images/roleplay/idea-alien.webp',
    roleKey: 'alienPartnerRoleCaption',
    lines: [
      { mine: false, text: 'What is this blue planet?' },
      { mine: true, text: "That's Earth. We have pizza!" },
      { mine: false, text: 'Pizza? Take me there!' },
    ],
  },
} as const;

/** 대화 — 상황 그림이 무대가 되어 어둠으로 녹아들고, 그 아래 말풍선이 차례로 떠오른다 */
export const RoleplayTalkDemo = ({
  talk,
  width,
}: {
  talk: keyof typeof TALKS;
  width: number;
}) => {
  const t = useTranslations('paywall.roleplayDemo');
  const { src, roleKey, lines } = TALKS[talk];

  return (
    <DemoScreen width={width}>
      <div className="absolute inset-0 bg-[#14132b]">
        <div className="relative h-[310px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element -- 작은 장식 그림이라 이미지 최적화가 할 일이 없다 */}
          <img
            src={src}
            alt=""
            className="size-full object-cover object-top"
            draggable={false}
          />
          <div className="absolute inset-x-0 -bottom-px h-1/2 bg-linear-to-b from-[#14132b]/0 to-[#14132b]" />
          <p className="absolute bottom-2 left-6 rounded-full bg-[#14132b]/70 px-4 py-2 text-15 font-bold text-white">
            {t(roleKey)}
          </p>
        </div>
        <div className="flex flex-col gap-2.5 px-6 pt-3">
          {lines.map((line, index) => (
            <p
              key={line.text}
              className={`animate-reveal-up max-w-[320px] rounded-3xl px-5 py-3 text-17 font-bold ${
                line.mine
                  ? 'self-end rounded-tr-md bg-primary text-primary-foreground'
                  : 'self-start rounded-tl-md bg-white/14 text-white'
              }`}
              style={{ '--i': 2 + index * 9 } as CSSProperties}
            >
              {line.text}
            </p>
          ))}
        </div>
      </div>
    </DemoScreen>
  );
};
