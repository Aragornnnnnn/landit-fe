// 무료 vs 프리미엄 비교표 — 기능 이름 왼쪽, 무료·프리미엄 두 열. 프리미엄 열만 연한 주황 기둥으로 띄운다.
// 기둥과 무료 열은 처음부터 있고, 프리미엄 체크만 위에서 아래로 하나씩 켜진다 — 애니메이션은 CSS다 (rAF가 멎은 웹뷰에서도 끝까지 간다, LAN-375)
import type { CSSProperties } from 'react';

import { CheckIcon } from '@/shared/ui/Icons';

import { BENEFITS } from '../model/benefits';
import { PremiumPill } from './premium-brand';

// 열 폭 — 체크 하나가 들어가는 칸이라 좁게, 프리미엄은 배지가 양옆에 여백을 두고 앉을 만큼 넓게.
// 배지가 기둥을 꽉 채우면 기둥이 열이 아니라 배지 배경으로 읽힌다
const FREE_COLUMN = 'w-[52px]';
const PREMIUM_COLUMN = 'w-[86px]';
// 줄 높이는 tr이 아니라 셀에 건다 — tr의 height는 내용 높이에 밀려 무시된다.
// 작은 폰(667pt)은 여섯 줄이 겨우 들어가는 높이라 한 단계 더 좁힌다
const ROW_HEIGHT = 'h-[30px] short:h-5';

export const BenefitComparison = () => (
  <section className="px-5 pt-2 short:pt-1">
    <div className="relative">
      {/* 프리미엄 열 기둥 — 표 뒤에 깔려 머리글부터 마지막 줄까지 덮는다. 열의 틀이라 처음부터 떠 있는다 */}
      <div
        aria-hidden="true"
        className={`absolute inset-y-0 right-0 ${PREMIUM_COLUMN} rounded-xl bg-selected`}
      />
      <table className="relative w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <th scope="col" className="h-9 short:h-[23px]" />
            <th
              scope="col"
              className={`${FREE_COLUMN} text-center text-[13px] leading-none font-bold text-muted-foreground`}
            >
              무료
            </th>
            <th scope="col" className={`${PREMIUM_COLUMN} text-center`}>
              <PremiumPill size="sm" />
            </th>
          </tr>
        </thead>
        <tbody>
          {BENEFITS.map(({ text, free }, index) => (
            <tr key={text}>
              <td
                className={`${ROW_HEIGHT} text-[15px] leading-[1.3] text-foreground short:text-[13px]`}
              >
                {text}
              </td>
              <td className="text-center">
                {free ? (
                  <CheckIcon
                    size={18}
                    strokeWidth={2.5}
                    className="inline-block text-muted-foreground"
                  />
                ) : (
                  <span className="inline-block h-0.5 w-3 rounded-full bg-border align-middle" />
                )}
                <span className="sr-only">
                  {free ? '무료 포함' : '무료 미포함'}
                </span>
              </td>
              <td className="text-center">
                {/* 줄 번호가 등장 순서다 — CSS 변수로 넘겨 딜레이를 계단으로 만든다 */}
                <span
                  className="animate-check-in inline-block"
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
