// 페이월의 무료 vs 프리미엄 혜택 비교표
import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';

import { CheckIcon } from '@/shared/ui/Icons';

import { BENEFITS } from '../../model/product/benefits';
import { PremiumPill } from '../premium-brand';

/** 체크 하나가 들어가는 칸이라 좁다 */
const FREE_COLUMN = 'w-[52px]';
/** 기둥 폭이자 머리글 배지가 앉는 칸 — 배지가 꽉 차면 기둥이 열이 아니라 배지 배경으로 읽힌다 */
const PREMIUM_COLUMN = 'w-[86px]';
/** 기둥이 없을 때 두 칸 — 기둥 몫을 덜어 무료 칸을 넓혀 두 열 사이를 벌린다. 합은 기둥 있을 때와 같아 기능 이름이 줄바꿈되지 않는다 */
const WIDE_FREE_COLUMN = 'w-[62px]';
const SLIM_PREMIUM_COLUMN = 'w-[76px]';
/** 줄 높이는 `tr`이 아니라 셀에 건다 — `tr`의 height는 내용 높이에 밀려 무시된다 */
const ROW_HEIGHT = 'h-[30px] short:h-5';
/** 머리글 두 칸을 배지 높이(18px) 상자에 담아 가운데 맞춘다 — 베이스라인에 맡기면 작은 "무료"가 위로 뜬다.
 * 최소 높이인 건 글자 크기를 키우면 배지가 18px보다 커져서다 */
const HEADER_LABEL = 'flex min-h-[18px] items-center justify-center';

/**
 * 기능 이름 왼쪽, 무료·프리미엄 두 열. 프리미엄 열만 연한 주황 기둥으로 띄운다.
 *
 * 줄은 {@link BENEFITS} 순서 그대로다. 기둥과 무료 열은 처음부터 떠 있고 프리미엄 체크만 위에서
 * 아래로 켜지는데, 줄 번호를 CSS 변수 `--i`로 넘겨 `globals.css`의 `animate-check-in`이 딜레이를
 * 계단으로 만든다. motion이 아니라 CSS인 것은 rAF가 멎은 웹뷰에서도 끝까지 가야 해서다 (LAN-375).
 */
export const BenefitComparison = ({
  benefits,
  pillar = true,
}: {
  /** 그릴 줄 — 환급 페이월은 적립 줄을 더한 목록을 넘긴다. 없으면 {@link BENEFITS}를 화면 언어로 그린다 */
  benefits?: { text: string; free: boolean }[];
  /** 프리미엄 열 뒤 주황 기둥 — 끄면 주황 체크와 배지만으로 강조하고 두 열을 넓게 벌린다 */
  pillar?: boolean;
}) => {
  const t = useTranslations('subscription');
  const rows =
    benefits ??
    BENEFITS.map(({ labelKey, free }) => ({
      text: t(`benefits.${labelKey}`),
      free,
    }));
  const freeColumn = pillar ? FREE_COLUMN : WIDE_FREE_COLUMN;
  const premiumColumn = pillar ? PREMIUM_COLUMN : SLIM_PREMIUM_COLUMN;

  return (
    <section className="px-5 pt-2 short:pt-1">
      <div className="relative">
        {/* 표 뒤에 깔려 머리글부터 마지막 줄까지 덮는다 */}
        {pillar && (
          <div
            aria-hidden="true"
            className={`absolute inset-y-0 right-0 ${PREMIUM_COLUMN} rounded-xl bg-selected`}
          />
        )}
        <table className="relative w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th scope="col" className="h-9 short:h-[23px]" />
              <th scope="col" className={freeColumn}>
                <span
                  className={`${HEADER_LABEL} text-13 leading-none font-bold text-muted-foreground`}
                >
                  {t('benefitComparison.freeLabel')}
                </span>
              </th>
              <th scope="col" className={premiumColumn}>
                <span className={HEADER_LABEL}>
                  <PremiumPill size="sm" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ text, free }, index) => (
              <tr key={text}>
                <th
                  scope="row"
                  className={`${ROW_HEIGHT} text-left text-15 leading-[1.3] font-normal text-foreground short:text-13`}
                >
                  {text}
                </th>
                {/* 세 마크 모두 align-middle — 기본 베이스라인 정렬이면 크기가 다른 체크끼리 줄이 어긋난다 */}
                <td className="text-center">
                  {free ? (
                    <CheckIcon
                      size={18}
                      strokeWidth={2.5}
                      className="inline-block align-middle text-muted-foreground"
                    />
                  ) : (
                    <span className="inline-block h-0.5 w-3 rounded-full bg-border align-middle" />
                  )}
                  <span className="sr-only">
                    {free
                      ? t('benefitComparison.freeIncludedLabel')
                      : t('benefitComparison.freeExcludedLabel')}
                  </span>
                </td>
                <td className="text-center">
                  <span
                    className="animate-check-in inline-block align-middle"
                    style={{ '--i': index } as CSSProperties}
                  >
                    <CheckIcon
                      size={20}
                      strokeWidth={3}
                      className="block text-primary"
                    />
                    <span className="sr-only">
                      {t('benefitComparison.premiumIncludedLabel')}
                    </span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
