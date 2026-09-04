// LetterBlocks — 문단 블록은 마크다운으로 그려서 어드민이 블록 하나에 링크·이미지·목록을 담을 수 있다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { LetterBlocks } from './LetterBlocks';

afterEach(cleanup);

describe('LetterBlocks', () => {
  it('문단 블록의 마크다운 링크를 링크로 그린다', () => {
    render(
      <LetterBlocks
        blocks={[
          { type: 'PARAGRAPH', text: '[릴리즈 노트](https://landit.im/notes)' },
        ]}
      />,
    );

    expect(
      screen.getByRole('link', { name: '릴리즈 노트' }).getAttribute('href'),
    ).toBe('https://landit.im/notes');
  });

  it('문단 블록 안의 엔터 한 번을 줄바꿈으로 그린다', () => {
    const { container } = render(
      <LetterBlocks blocks={[{ type: 'PARAGRAPH', text: '첫 줄\n둘째 줄' }]} />,
    );

    expect(container.querySelector('br')).not.toBeNull();
  });
});
