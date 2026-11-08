// 리뷰 접기 검증 — 접혀 있어도 리뷰 글은 문서에 있고, 더보기를 누르면 펼쳐지며 버튼이 사라진다
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ReviewFold } from './ReviewFold';

afterEach(cleanup);

const renderFold = () =>
  render(
    <ReviewFold moreLabel="리뷰 더보기">
      <p>정말 좋아요</p>
    </ReviewFold>,
  );

describe('ReviewFold', () => {
  it('처음엔 접혀 있지만 리뷰 글은 문서에 있다', () => {
    renderFold();

    expect(screen.getByText('정말 좋아요')).toBeTruthy();
    expect(screen.getByRole('button', { name: '리뷰 더보기' })).toBeTruthy();
  });

  it('더보기를 누르면 펼쳐지고 버튼이 사라진다', () => {
    // Given 접힌 리뷰
    const { container } = renderFold();
    const fold = container.firstElementChild?.firstElementChild;
    expect(fold?.className).toContain('max-h-[500px]');

    // When 더보기를 누르면
    fireEvent.click(screen.getByRole('button', { name: '리뷰 더보기' }));

    // Then 높이 제한이 풀리고 버튼은 없어진다
    expect(fold?.className).toContain('max-h-[6000px]');
    expect(screen.queryByRole('button', { name: '리뷰 더보기' })).toBeNull();
  });
});
