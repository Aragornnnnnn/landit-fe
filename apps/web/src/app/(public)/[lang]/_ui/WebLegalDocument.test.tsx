// 웹 약관 문서 검증 — 제목·시행일과 목차를 보여 주고(문서 버전은 웹에서 숨김), 목차의 각 항목이 해당 조항으로 이어진다
// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { WebLegalDocument } from './WebLegalDocument';

afterEach(cleanup);

const DOCUMENT = {
  title: '서비스 이용약관',
  effectiveDate: '2026년 10월 23일',
  version: 'v1.4',
  introduction: ['본 약관은 서비스 이용 조건을 정합니다.'],
  sections: [
    {
      id: 'definitions',
      title: '1. 용어의 정의',
      paragraphs: ['용어의 뜻입니다.'],
      bullets: ['"회사"는 Landit입니다.'],
    },
    {
      id: 'terms',
      title: '2. 약관의 효력과 변경',
      paragraphs: ['약관을 게시합니다.'],
    },
  ],
};

const renderDocument = () =>
  render(
    <WebLegalDocument
      document={DOCUMENT}
      labels={{ effectiveDate: '시행일', toc: '목차' }}
    />,
  );

describe('WebLegalDocument', () => {
  it('문서 제목과 시행일을 보여 주고, 문서 버전은 웹에서 보여 주지 않는다', () => {
    renderDocument();

    expect(
      screen.getByRole('heading', { level: 1, name: '서비스 이용약관' }),
    ).toBeTruthy();
    expect(screen.getByText('2026년 10월 23일')).toBeTruthy();
    expect(screen.queryByText('v1.4')).toBeNull();
  });

  it('목차의 각 항목이 해당 조항으로 이어진다', () => {
    renderDocument();

    const link = screen.getByRole('link', { name: '2. 약관의 효력과 변경' });
    expect(link.getAttribute('href')).toBe('#terms');
    expect(
      screen
        .getByRole('heading', { level: 2, name: '2. 약관의 효력과 변경' })
        .closest('section')?.id,
    ).toBe('terms');
  });

  it('조항의 문단과 목록을 모두 보여 준다', () => {
    renderDocument();

    expect(screen.getByText('용어의 뜻입니다.')).toBeTruthy();
    expect(screen.getByText('"회사"는 Landit입니다.')).toBeTruthy();
  });
});
