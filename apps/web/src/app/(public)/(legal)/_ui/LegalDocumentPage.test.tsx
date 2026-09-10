// LegalDocumentPage — 뒤로가기는 온 곳(페이월·마이페이지)으로 한 칸, 직접 진입이면 첫 화면
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LegalDocumentPage } from './LegalDocumentPage';

const mocks = vi.hoisted(() => ({ replace: vi.fn(), back: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace, back: mocks.back }),
}));

const legalDocument = {
  title: '개인정보 처리방침',
  effectiveDate: '2026년 10월 1일',
  version: '1.1',
  introduction: [],
  sections: [],
};

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('LegalDocumentPage 뒤로가기', () => {
  it('페이월처럼 다른 화면에서 들어왔으면 그 화면으로 한 칸 돌아간다', () => {
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(2);
    render(<LegalDocumentPage document={legalDocument} />);

    fireEvent.click(screen.getByRole('button', { name: '돌아가기' }));

    expect(mocks.back).toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('스토어 링크로 바로 열렸으면 돌아갈 곳이 없어 첫 화면으로 보낸다 — 로그인 전일 수 있다', () => {
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(1);
    render(<LegalDocumentPage document={legalDocument} />);

    fireEvent.click(screen.getByRole('button', { name: '돌아가기' }));

    expect(mocks.replace).toHaveBeenCalledWith('/');
    expect(mocks.back).not.toHaveBeenCalled();
  });
});
