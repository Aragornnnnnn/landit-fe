// BusinessInfoFooter — 접힌 상태에서는 제목만 보이고, 펼치면 확보된 항목만 표시하는 계약 검증
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { BUSINESS_INFO, BusinessInfoFooter } from './BusinessInfoFooter';

afterEach(cleanup);

describe('BusinessInfoFooter', () => {
  it('처음에는 접혀 있어 제목만 보이고, 누르면 펼쳐진다', () => {
    // given
    render(<BusinessInfoFooter />);
    expect(screen.queryByText('284-24-02238')).not.toBeInTheDocument();

    // when — 제목 줄을 누른다
    fireEvent.click(screen.getByRole('button', { name: '사업자 정보' }));

    // then
    expect(screen.getByText('284-24-02238')).toBeInTheDocument();
  });

  it('값이 없는 항목은 펼쳐도 줄 자체를 그리지 않는다', () => {
    // given — 전화번호와 통신판매업 신고번호가 아직 없는 상태
    const info = { ...BUSINESS_INFO, phone: null, mailOrderNumber: null };
    render(<BusinessInfoFooter info={info} />);

    // when
    fireEvent.click(screen.getByRole('button', { name: '사업자 정보' }));

    // then
    expect(screen.getByText('랜딧(Landit)')).toBeInTheDocument();
    expect(screen.queryByText('전화번호')).not.toBeInTheDocument();
    expect(screen.queryByText('통신판매업 신고번호')).not.toBeInTheDocument();
  });

  it('값이 채워지면 해당 줄이 나타난다', () => {
    // given
    const info = {
      ...BUSINESS_INFO,
      phone: '010-0000-0000',
      mailOrderNumber: '제2026-충북청주-0000호',
    };
    render(<BusinessInfoFooter info={info} />);

    // when
    fireEvent.click(screen.getByRole('button', { name: '사업자 정보' }));

    // then
    expect(screen.getByText('010-0000-0000')).toBeInTheDocument();
    expect(screen.getByText('제2026-충북청주-0000호')).toBeInTheDocument();
  });
});
