// 무료 vs 프리미엄 비교표 — 무료 열은 되는 줄만 체크, 프리미엄 열은 전부 체크이고 순서대로 등장한다
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { BENEFITS } from '../model/benefits';
import { BenefitComparison } from './BenefitComparison';

afterEach(() => cleanup());

describe('BenefitComparison', () => {
  it('무료 열은 무료로도 되는 줄만 체크하고 나머지는 빈칸으로 둔다', () => {
    render(<BenefitComparison />);

    const freeCount = BENEFITS.filter((benefit) => benefit.free).length;
    expect(screen.getAllByText('무료 포함')).toHaveLength(freeCount);
    expect(screen.getAllByText('무료 미포함')).toHaveLength(
      BENEFITS.length - freeCount,
    );
  });

  it('프리미엄 열은 모든 줄에 체크가 있고, 줄 순서대로 늦게 나타난다', () => {
    render(<BenefitComparison />);

    const checks = screen.getAllByText('프리미엄 포함');
    expect(checks).toHaveLength(BENEFITS.length);
    // 등장 순서는 CSS 변수로 넘긴다 — 애니메이션은 CSS가 맡고, 여기서는 줄마다 번호가 매겨졌는지만 본다
    const orders = checks.map((label) =>
      label.closest('[style]')?.getAttribute('style'),
    );
    orders.forEach((style, index) => expect(style).toContain(`--i: ${index}`));
  });

  it('머리글에 무료와 PREMIUM 두 열이 있다', () => {
    render(<BenefitComparison />);

    const head = screen.getAllByRole('columnheader');
    expect(within(head[1]).getByText('무료')).toBeInTheDocument();
    expect(within(head[2]).getByText('PREMIUM')).toBeInTheDocument();
  });

  it('기능 이름이 줄의 머리글이라 낭독기가 어느 기능의 체크인지 읽어 준다', () => {
    render(<BenefitComparison />);

    // 열 머리글만 있고 줄 머리글이 없으면 "프리미엄 포함"이 어느 줄 것인지 알 수 없다
    const rowHeaders = screen.getAllByRole('rowheader');
    expect(rowHeaders.map((cell) => cell.textContent)).toEqual(
      BENEFITS.map((benefit) => benefit.text),
    );
  });
});
