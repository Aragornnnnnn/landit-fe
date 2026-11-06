// 자주 묻는 질문 한 줄 검증 — 누르면 답이 펼쳐지고 다시 누르면 접힌다. 접혀 있어도 답은 문서에 있다(검색엔진·AI가 읽는다)
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FaqItem } from './FaqItem';

afterEach(cleanup);

const renderItem = () =>
  render(
    <FaqItem question="랜딧은 어떤 앱이에요?" answer="영어 회화 앱이에요." />,
  );

describe('FaqItem', () => {
  it('처음엔 접혀 있지만 답은 문서에 있다', () => {
    renderItem();

    const button = screen.getByRole('button', { name: /랜딧은 어떤 앱이에요/ });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText('영어 회화 앱이에요.')).toBeTruthy();
  });

  it('질문을 누르면 펼쳐지고 다시 누르면 접힌다', () => {
    // Given
    renderItem();
    const button = screen.getByRole('button', { name: /랜딧은 어떤 앱이에요/ });

    // When 한 번 누르면
    fireEvent.click(button);

    // Then 펼쳐진다
    expect(button.getAttribute('aria-expanded')).toBe('true');

    // When 다시 누르면 접힌다
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});
