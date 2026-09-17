// 페이월의 무료 vs 프리미엄 혜택 비교표
import type { CSSProperties } from 'react';

import { CheckIcon } from '@/shared/ui/Icons';

import { BENEFITS } from '../model/benefits';
import { PremiumPill } from './premium-brand';

/** 체크 하나가 들어가는 칸이라 좁다 */
const FREE_COLUMN = 'w-[52px]';
/** 기둥 폭이자 머리글 배지가 앉는 칸 — 배지가 꽉 차면 기둥이 열이 아니라 배지 배경으로 읽힌다 */
const PREMIUM_COLUMN = 'w-[86px]';
/** 줄 높이는 `tr`이 아니라 셀에 건다 — `tr`의 height는 내용 높이에 밀려 무시된다 */
const ROW_HEIGHT = 'h-[30px] short:h-5';
/** 머리글 두 칸을 배지 높이(18px) 상자에 담아 가운데 맞춘다 — 베이스라인에 맡기면 작은 "무료"가 위로 뜬다 */
const HEADER_LABEL = 'flex h-[18px] items-center justify-center';

/**
 * 기능 이름 왼쪽, 무료·프리미엄 두 열. 프리미엄 열만 연한 주황 기둥으로 띄운다.
 *
 * 줄은 {@link BENEFITS} 순서 그대로다. 기둥과 무료 열은 처음부터 떠 있고 프리미엄 체크만 위에서
 * 아래로 켜지는데, 줄 번호를 CSS 변수 `--i`로 넘겨 `globals.css`의 `animate-check-in`이 딜레이를
 * 계단으로 만든다. motion이 아니라 CSS인 것은 rAF가 멎은 웹뷰에서도 끝까지 가야 해서다 (LAN-375).
 */
export const BenefitComparison = () => (
  <section className="px-5 pt-2 short:pt-1">
    <div className="relative">
      {/* 표 뒤에 깔려 머리글부터 마지막 줄까지 덮는다 */}
      <div
        aria-hidden="true"
        className={`absolute inset-y-0 right-0 ${PREMIUM_COLUMN} rounded-xl bg-selected`}
      />
      <table className="relative w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <th scope="col" className="h-9 short:h-[23px]" />
            <th scope="col" className={FREE_COLUMN}>
              <span
                className={`${HEADER_LABEL} text-[13px] leading-none font-bold text-muted-foreground`}
              >
                무료
              </span>
            </th>
            <th scope="col" className={PREMIUM_COLUMN}>
              <span className={HEADER_LABEL}>
                <PremiumPill size="sm" />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {BENEFITS.map(({ text, free }, index) => (
            <tr key={text}>
              <th
                scope="row"
                className={`${ROW_HEIGHT} text-left text-[15px] leading-[1.3] font-normal text-foreground short:text-[13px]`}
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
                  {free ? '무료 포함' : '무료 미포함'}
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
                  <span className="sr-only">프리미엄 포함</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
