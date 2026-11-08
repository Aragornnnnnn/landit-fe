// 첫 화면 월계수 배지 — 값은 랜딩 숫자 단일 출처를 쓰고, 서버가 실제 숫자를 그대로 그린다(검색엔진·스크립트 전에도 0이 아니라 실제 값). 월계수는 전용으로 그린 잎 모양이다
import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/shared/i18n/locale';

import { LANDING_STATS } from '../_model/landing-stats';
import { StarIcon } from './StarIcon';

const LEAF =
  'M -24 -1 Q -25 0 -24 1 C -12 17 12 17 24 1 Q 25 0 24 -1 C 12 -17 -12 -17 -24 -1 Z';

/** 잎 하나를 놓는 자리 — 같은 잎을 돌려 왼쪽 월계수를 만든다 */
const LEAVES = [
  'translate(127 33) rotate(-48)',
  'translate(71 55) rotate(-95)',
  'translate(116 88) rotate(-15)',
  'translate(42 108) rotate(-105)',
  'translate(90 131) rotate(-35)',
  'translate(30 175) rotate(-117)',
  'translate(84 185) rotate(-40)',
  'translate(34 243) rotate(40)',
  'translate(87 236) rotate(-65)',
  'translate(119 275) rotate(-85)',
  'translate(70 300) rotate(25)',
  'translate(159 306) rotate(-90)',
  'translate(120 345) rotate(5)',
];

const Laurel = ({ flip = false }: { flip?: boolean }) => (
  <svg
    viewBox="0 0 188 370"
    aria-hidden="true"
    className={`h-[38px] w-[19px] shrink-0 fill-[#c99a5f] min-[360px]:h-[46px] min-[360px]:w-[23px] sm:h-[72px] sm:w-[36px] ${flip ? '-scale-x-100' : ''}`}
  >
    {LEAVES.map((transform) => (
      <path key={transform} d={LEAF} transform={transform} />
    ))}
  </svg>
);

const Badge = ({
  value,
  label,
  star = false,
}: {
  value: string;
  label: string;
  star?: boolean;
}) => (
  <li className="flex items-center gap-0.5 sm:gap-1.5">
    <Laurel />
    <div className="text-center">
      <p className="flex items-center justify-center gap-0.5 text-[20px] leading-none font-bold whitespace-nowrap min-[360px]:text-[24px] sm:text-[36px]">
        {star && (
          <StarIcon className="size-[18px] min-[360px]:size-[21px] sm:size-8" />
        )}
        {value}
      </p>
      <p className="mt-1.5 text-[11px] font-medium whitespace-nowrap text-[#57524c] min-[360px]:text-[12px] sm:text-[15px]">
        {label}
      </p>
    </div>
    <Laurel flip />
  </li>
);

export const HeroBadges = async ({ locale }: { locale: Locale }) => {
  const t = await getTranslations({ locale, namespace: 'landing.badges' });
  return (
    <ul className="-mx-4 flex justify-center gap-1 sm:mx-0 sm:gap-4 lg:justify-start">
      <Badge
        star
        value={String(LANDING_STATS.rating.value)}
        label={t('ratingLabel')}
      />
      <Badge value={LANDING_STATS.users} label={t('usersLabel')} />
      <Badge value={LANDING_STATS.spokenLines} label={t('spokenLinesLabel')} />
    </ul>
  );
};
