// BusinessInfoFooter — 아직 확보되지 않은 항목은 줄을 숨기고, 확보된 항목만 표시하는 계약 검증
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { BUSINESS_INFO, BusinessInfoFooter } from './BusinessInfoFooter';

afterEach(cleanup);

describe('BusinessInfoFooter', () => {
  it('값이 없는 항목은 줄 자체를 그리지 않는다', () => {
    // given — 전화번호와 통신판매업 신고번호가 아직 없는 상태
    const info = { ...BUSINESS_INFO, phone: null, mailOrderNumber: null };

    // when
    render(<BusinessInfoFooter info={info} />);

    // then — 확보된 항목은 보이고, 없는 항목은 라벨조차 없다
    expect(screen.getByText('랜딧(Landit)')).toBeInTheDocument();
    expect(screen.getByText('284-24-02238')).toBeInTheDocument();
    expect(screen.queryByText('전화번호')).not.toBeInTheDocument();
    expect(screen.queryByText('통신판매업 신고번호')).not.toBeInTheDocument();
  });

  it('값이 채워지면 해당 줄이 나타난다', () => {
    // given — 전화번호와 신고번호가 확보된 상태
    const info = {
      ...BUSINESS_INFO,
      phone: '010-0000-0000',
      mailOrderNumber: '제2026-충북청주-0000호',
    };

    // when
    render(<BusinessInfoFooter info={info} />);

    // then
    expect(screen.getByText('전화번호')).toBeInTheDocument();
    expect(screen.getByText('010-0000-0000')).toBeInTheDocument();
    expect(screen.getByText('제2026-충북청주-0000호')).toBeInTheDocument();
  });
});
